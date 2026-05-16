#!/usr/bin/env python3
"""
拼音教学主服务 — FastAPI + WebSocket
端口: 8081
"""
import asyncio, base64, json, os, struct, sys, time, traceback
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Optional

import httpx
import psycopg2
import uvicorn
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, DIR)
ROOT = os.path.dirname(os.path.dirname(DIR))  # 项目根目录

from config import (DB_CONFIG, DOUBAO_IMAGE_API_KEY, DOUBAO_IMAGE_MODEL,
                    DOUBAO_IMAGE_URL, XF_APP_ID, XF_API_KEY, XF_API_SECRET)
from evaluator import XunfeiEvaluator
from tts_client import tts_synthesize
from asr_client import asr_recognize
from glm_client import glm_chat, glm_chat_stream
from oss_client import upload_image_to_oss

evaluator = XunfeiEvaluator(XF_APP_ID, XF_API_KEY, XF_API_SECRET)

app = FastAPI(title="拼音教学服务")

# CORS — 允许所有来源，方便 iPad / 局域网测试
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

PINYIN_NORMALIZE = {"ɑ": "a"}


@contextmanager
def get_db():
    conn = psycopg2.connect(**DB_CONFIG)
    try:
        yield conn
    finally:
        conn.close()


# ─────────────────────────────────────────────
# REST API
# ─────────────────────────────────────────────

@app.get("/api/lesson")
def api_lesson(letter: str = "z"):
    normalized = PINYIN_NORMALIZE.get(letter, letter)
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """SELECT pinyin_char, ref_char, ref_pinyin, teaching_script,
                      example_words, painting_guidance
               FROM pinyin_content WHERE pinyin_char = %s""",
            (normalized,),
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(404, f"未找到拼音: {letter}")
    return {
        "pinyin": row[0], "ref_char": row[1], "ref_pinyin": row[2],
        "teaching_script": row[3],
        "example_words": row[4] if isinstance(row[4], list) else json.loads(row[4] or "[]"),
        "painting_guidance": row[5] or "",
    }


@app.get("/api/character/{char_id}")
def api_character(char_id: int):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, char, pinyin, eval_pinyin, pronunciation_prompt, prompt_type FROM character_content WHERE id = %s",
            (char_id,),
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(404, "未找到")
    return {"id": row[0], "char": row[1], "pinyin": row[2],
            "eval_pinyin": row[3], "pronunciation_prompt": row[4], "prompt_type": row[5]}


class TtsRequest(BaseModel):
    text: str

@app.post("/api/tts")
async def api_tts(req: TtsRequest):
    """文本 → PCM base64 (24kHz mono 16bit)"""
    import traceback
    try:
        pcm = await tts_synthesize(req.text)
        if not pcm or len(pcm) == 0:
            raise RuntimeError("TTS returned empty audio")
        return {"audio": base64.b64encode(pcm).decode(), "format": "pcm", "sample_rate": 24000}
    except Exception as e:
        traceback.print_exc()
        print(f"[api_tts] Error synthesizing '{req.text[:50]}': {e}")
        raise HTTPException(500, f"TTS failed: {e}")


class EvalRequest(BaseModel):
    ref_char: str
    ref_pinyin: str
    audio: str          # base64 MP3/WAV
    encoding: str = "lame"
    slack: float = 0.3

@app.post("/api/eval_pinyin")
async def api_eval_pinyin(req: EvalRequest):
    import traceback
    # 1. 保存录音到 WAV 文件
    audio_url = ""
    try:
        audio_url = _save_eval_audio(req.audio, req.encoding, req.ref_char, req.ref_pinyin)
    except Exception:
        print(f"[eval] 保存录音失败: {traceback.format_exc()}")

    # 2. 讯飞评测
    result = await evaluator.evaluate(
        ref_text=req.ref_char, ref_pinyin=req.ref_pinyin,
        audio_b64=req.audio, encoding=req.encoding, slack=req.slack,
    )
    if not result:
        raise HTTPException(500, "评测无结果")
    r = result.get("result", result)
    overall = float(r.get("overall", 0))
    passed = overall >= 60

    # 3. 保存评测结果到数据库
    try:
        _save_eval_result(req, result, r, overall, passed, audio_url)
    except Exception:
        print(f"[eval] 保存评测记录失败: {traceback.format_exc()}")

    return {"passed": passed, "overall": overall, "detail": r, "audio_url": audio_url}


RECORDING_DIR = os.path.join(ROOT, "recorded_audio")


@app.get("/api/recordings")
def api_list_recordings():
    """返回所有录音文件列表，按时间倒序"""
    import glob
    os.makedirs(RECORDING_DIR, exist_ok=True)
    files = []
    for f in sorted(os.listdir(RECORDING_DIR), reverse=True):
        if f.endswith((".wav", ".mp3")):
            fpath = os.path.join(RECORDING_DIR, f)
            size_kb = round(os.path.getsize(fpath) / 1024, 1)
            files.append({"name": f, "url": f"/recorded_audio/{f}", "size_kb": size_kb})
    return {"files": files, "total": len(files)}


def _save_eval_audio(audio_b64: str, encoding: str, ref_char: str, ref_pinyin: str) -> str:
    """将 base64 音频解码并保存为 WAV 文件，返回可访问的 URL 路径"""
    os.makedirs(RECORDING_DIR, exist_ok=True)
    raw = base64.b64decode(audio_b64)
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S_%f")[:-3]
    safe_char = ref_char if len(ref_char) <= 2 else ref_char[:2]
    filename = f"{safe_char}_{ref_pinyin}_{ts}.wav"
    filepath = os.path.join(RECORDING_DIR, filename)

    if encoding == "raw":
        # 前端发送的是 16kHz / 16bit / mono 裸 PCM，需要加 WAV 头
        sample_rate = 16000
        bits = 16
        channels = 1
        data_size = len(raw)
        header = struct.pack(
            "<4sI4s4sIHHIIHH4sI",
            b"RIFF", 36 + data_size, b"WAVE",
            b"fmt ", 16, 1, channels,
            sample_rate, sample_rate * channels * bits // 8,
            channels * bits // 8, bits,
            b"data", data_size,
        )
        with open(filepath, "wb") as f:
            f.write(header)
            f.write(raw)
    else:
        # MP3 / lame 格式，存成 .mp3
        filepath = filepath.replace(".wav", ".mp3")
        with open(filepath, "wb") as f:
            f.write(raw)

    return f"/recorded_audio/{filename}"


def _save_eval_result(req: "EvalRequest", result: dict, r: dict,
                       overall: float, passed: bool, audio_url: str):
    """保存评测记录到 evaluation_results 表"""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO evaluation_results
               (ref_text, ref_pinyin, overall_score, pronunciation, tone_score,
                integrity, rhythm, detail_json, audio_url, passed, pinyin_char)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (
                req.ref_char, req.ref_pinyin,
                overall,
                r.get("pronunciation"),
                r.get("tone"),
                r.get("integrity"),
                r.get("rhythm"),
                json.dumps(result, ensure_ascii=False),
                audio_url,
                passed,
                "",  # pinyin_char — 前端没有传，留空
            ),
        )
        conn.commit()


class AsrRequest(BaseModel):
    audio: str  # base64 WAV PCM

@app.post("/api/asr")
async def api_asr(req: AsrRequest):
    import traceback
    try:
        pcm_bytes = base64.b64decode(req.audio)
        # 跳过 WAV header (44 bytes)
        if pcm_bytes[:4] == b'RIFF':
            pcm_bytes = pcm_bytes[44:]
        text = await asr_recognize(pcm_bytes)
        return {"text": text}
    except Exception:
        traceback.print_exc()
        raise HTTPException(500, traceback.format_exc())


class GlmFeedbackRequest(BaseModel):
    passed: bool
    target: str   # 读的内容（拼音对应的汉字或例字本身）
    score: float

@app.post("/api/glm_feedback")
async def api_glm_feedback(req: GlmFeedbackRequest):
    if req.passed:
        prompt = f'孩子刚刚读了"{req.target}"，读得非常棒！请用一句话夸奖孩子，语气活泼可爱，适合5岁小朋友，不超过20字。不要用emoji。'
    else:
        prompt = f'孩子刚刚读了"{req.target}"，还需要再练习一下。请用一句话鼓励孩子再试一次，语气温柔，适合5岁小朋友，不超过20字。不要用emoji。'
    text = await glm_chat(prompt)
    return {"text": text}


class GlmToCharactersRequest(BaseModel):
    ref_char: str       # 拼音对应的汉字，如 "资"
    example_words: list  # [{char, pinyin, meaning}, ...]

@app.post("/api/glm_to_characters")
async def api_glm_to_characters(req: GlmToCharactersRequest):
    words_desc = '、'.join(f'{w["char"]}（{w["meaning"]}）' for w in req.example_words)
    prompt = (
        f'孩子刚刚学会了拼音"{req.ref_char}"的发音。'
        f'请用一句话告诉孩子：那用"{req.ref_char}"来拼读的字有哪些呢？然后介绍下面{len(req.example_words)}个字：{words_desc}。'
        f'语气活泼可爱，适合5岁小朋友，不超过40字。'
    )
    text = await glm_chat(prompt)
    return {"text": text}


class GlmTransitionRequest(BaseModel):
    ref_char: str   # 拼音对应的汉字，如 "资"

@app.post("/api/glm_to_drawing")
async def api_glm_to_drawing(req: GlmTransitionRequest):
    prompt = f'孩子刚刚学完了拼音"{req.ref_char}"的发音和例字，现在要进入画画环节！请用一句话告诉孩子，语气活泼，适合5岁小朋友，不超过25字。'
    text = await glm_chat(prompt)
    return {"text": text}


class GlmDrawingRequest(BaseModel):
    user_text: str
    ref_char: str

@app.post("/api/glm_drawing")
async def api_glm_drawing(req: GlmDrawingRequest):
    system = (
        f'你是一个陪伴5岁小朋友画画的AI老师，当前主题是"{req.ref_char}"。'
        '如果孩子说画完了/完成了，回复JSON: {"action":"none","text":"哇，你画完了！那你画的是什么呀？告诉我吧～"}。'
        '如果孩子说要擦掉画布，回复JSON: {"action":"clear","text":"好的，帮你擦掉啦！"}。'
        '如果孩子说要恢复，回复JSON: {"action":"undo","text":"好的，帮你恢复啦！"}。'
        '如果孩子描述了自己画的内容（比如"我画了XXX"），你需要做两件事：'
        '1. 先夸奖孩子的画，一句话；'
        '2. 然后根据孩子的描述，生成一个适合AI绘画的英文prompt，描述要详细具体，包含画面风格、角度、色彩等，不超过80个英文单词。'
        '回复格式为JSON: {"action":"generate","text":"<夸奖的话>","prompt":"<英文绘画prompt>"}。'
        '其他情况只回复普通文字，不超过30字，语气活泼可爱。'
    )
    raw = await glm_chat(req.user_text, system=system)
    try:
        data = json.loads(raw)
        return {"action": data.get("action", "none"), "text": data.get("text", raw),
                "prompt": data.get("prompt", "")}
    except Exception:
        return {"action": "none", "text": raw, "prompt": ""}


class GlmFinishRequest(BaseModel):
    ref_char: str

@app.post("/api/glm_finish")
async def api_glm_finish(req: GlmFinishRequest):
    prompt = (
        f'孩子今天学完了"{req.ref_char}"的拼音和例字，也画了一幅画。'
        '请用两句话夸奖孩子，然后说今天的学习结束了，期待明天一起学习，再见。'
        '语气温柔活泼，适合5岁小朋友，不超过40字。'
    )
    text = await glm_chat(prompt)
    return {"text": text}


# ── 合并端点：LLM 生成文本 → TTS 合成 → 返回音频 ──

class GlmFeedbackTtsRequest(BaseModel):
    passed: bool
    target: str
    score: float

@app.post("/api/glm_feedback_tts")
async def api_glm_feedback_tts(req: GlmFeedbackTtsRequest):
    if req.passed:
        prompt = f'孩子刚刚读了"{req.target}"，读得非常棒！请用一句话夸奖孩子，语气活泼可爱，适合5岁小朋友，不超过20字。不要用emoji。'
    else:
        prompt = f'孩子刚刚读了"{req.target}"，还需要再练习一下。请用一句话鼓励孩子再试一次，语气温柔，适合5岁小朋友，不超过20字。不要用emoji。'
    text = await glm_chat(prompt)
    pcm = await tts_synthesize(text)
    return {"text": text, "audio": base64.b64encode(pcm).decode(), "format": "pcm", "sample_rate": 24000}


class GlmToCharactersTtsRequest(BaseModel):
    ref_char: str
    example_words: list

@app.post("/api/glm_to_characters_tts")
async def api_glm_to_characters_tts(req: GlmToCharactersTtsRequest):
    words_desc = '、'.join(f'{w["char"]}（{w["meaning"]}）' for w in req.example_words)
    prompt = (
        f'孩子刚刚学会了拼音"{req.ref_char}"的发音。'
        f'请用一句话告诉孩子：那用"{req.ref_char}"来拼读的字有哪些呢？然后介绍下面{len(req.example_words)}个字：{words_desc}。'
        f'语气活泼可爱，适合5岁小朋友，不超过40字。'
    )
    text = await glm_chat(prompt)
    pcm = await tts_synthesize(text)
    return {"text": text, "audio": base64.b64encode(pcm).decode(), "format": "pcm", "sample_rate": 24000}


# ── SSE 流式端点：LLM 流式输出 → TTS 合成 → 逐句推送 ──

class StreamSpeakRequest(BaseModel):
    prompt: str

@app.post("/api/stream_speak")
async def api_stream_speak(req: StreamSpeakRequest):
    import re

    def is_text_sentence(s):
        """过滤纯 emoji / 纯标点 / 空白句子"""
        cleaned = re.sub(r'[\U0001F300-\U0001FAFF☀-➿⭐✨❄\U0001F600-\U0001F64F✀-➿️\s]', '', s)
        cleaned = cleaned.strip('，。！？、；：""''…—～· \t\n\r')
        return len(cleaned) > 0

    async def generate():
        import traceback
        # 1. 流式收集 LLM 文本
        buffer = ""
        async for chunk in glm_chat_stream(req.prompt):
            buffer += chunk
            yield f"data: {json.dumps({'type': 'text', 'text': chunk}, ensure_ascii=False)}\n\n"

        full_text = buffer.strip()
        if not full_text:
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            return

        # 2. 按句子边界分割，过滤纯 emoji 句
        sentences = []
        current = ""
        for ch in full_text:
            current += ch
            if ch in "。！？\n":
                s = current.strip()
                if is_text_sentence(s):
                    sentences.append(s)
                current = ""
        if current.strip() and is_text_sentence(current.strip()):
            sentences.append(current.strip())

        # 3. 逐句 TTS（带错误处理）
        for i, sentence in enumerate(sentences):
            try:
                pcm = await tts_synthesize(sentence)
                yield f"data: {json.dumps({'type': 'audio', 'audio': base64.b64encode(pcm).decode(), 'format': 'pcm', 'sample_rate': 24000, 'index': i})}\n\n"
            except Exception:
                print(f"[stream_speak] TTS failed for sentence {i}: {sentence[:80]}")
                traceback.print_exc()

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


class ImageGenRequest(BaseModel):
    prompt: str
    image_base64: str   # data:image/png;base64,...
    size: str = "1920x1920"  # 输出尺寸，前端按画布比例计算

@app.post("/api/generate_image")
async def api_generate_image(req: ImageGenRequest):
    import traceback
    try:
        # 1. 上传画布到 OSS
        image_url = upload_image_to_oss(req.image_base64)
        print(f"[OSS] upload success: {image_url}")

        # 2. 调用豆包图生图
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                DOUBAO_IMAGE_URL,
                headers={"Authorization": f"Bearer {DOUBAO_IMAGE_API_KEY}",
                         "Content-Type": "application/json"},
                json={
                    "model": DOUBAO_IMAGE_MODEL,
                    "prompt": req.prompt,
                    "image": image_url,
                    "sequential_image_generation": "disabled",
                    "response_format": "url",
                    "size": req.size,
                    "stream": False,
                    "watermark": True,
                },
            )
            print(f"[Doubao] status={resp.status_code}, body={resp.text[:500]}")
            resp.raise_for_status()
            data = resp.json()

        result_url = data["data"][0]["url"]
        print(f"[Doubao] result_url={result_url}")

        # 3. 下载生成图并转 base64，绕过 CDN CORS 限制
        async with httpx.AsyncClient(timeout=30) as client:
            img_resp = await client.get(result_url)
            img_resp.raise_for_status()
            img_b64 = base64.b64encode(img_resp.content).decode()

        content_type = img_resp.headers.get("content-type", "image/jpeg")
        return {
            "url": result_url,
            "image_base64": f"data:{content_type};base64,{img_b64}"
        }
    except Exception:
        traceback.print_exc()
        raise HTTPException(500, traceback.format_exc())


# ─────────────────────────────────────────────
# 静态文件
# ─────────────────────────────────────────────

@app.get("/")
@app.get("/index.html")
async def serve_index():
    return FileResponse(os.path.join(ROOT, "index.html"), media_type="text/html")

app.mount("/", StaticFiles(directory=ROOT), name="static")

if __name__ == "__main__":
    import socket
    _ip = socket.gethostbyname(socket.gethostname())
    print("=" * 50)
    print("  拼音教学服务  https://localhost:8081")
    print(f"  iPad 访问:  https://{_ip}:8081")
    print("=" * 50)
    uvicorn.run(app, host="0.0.0.0", port=8081,
                ssl_certfile=os.path.join(DIR, "cert.pem"),
                ssl_keyfile=os.path.join(DIR, "key.pem"))
