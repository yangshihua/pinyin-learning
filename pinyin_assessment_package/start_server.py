#!/usr/bin/env python3
"""
拼音测评独立启动脚本
用法: python3 start_server.py
浏览器打开 http://localhost:8080/assessment.html
"""
import os
import sys

# 路径设置
DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(DIR, "backend")
FRONTEND_DIR = os.path.dirname(DIR)  # 项目根目录

# 将 backend 目录加入 import 路径
sys.path.insert(0, BACKEND_DIR)

import json
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional
from evaluator import XunfeiEvaluator

# ========== 讯飞配置 ==========
CONFIG_PATH = os.path.join(BACKEND_DIR, "suntone_config.json")
with open(CONFIG_PATH, encoding="utf-8") as f:
    XF_CONFIG = json.load(f)

evaluator = XunfeiEvaluator(
    app_id=XF_CONFIG["app_id"],
    api_key=XF_CONFIG["api_key"],
    api_secret=XF_CONFIG["api_secret"],
)

# ========== 数据库配置（修改此处适配目标项目） ==========
DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "pinyin_learning",
    "user": "balanceearnest",
}

PINYIN_NORMALIZE = {"ɑ": "a"}

import psycopg2
from contextlib import contextmanager

@contextmanager
def get_db():
    conn = psycopg2.connect(**DB_CONFIG)
    try:
        yield conn
    finally:
        conn.close()

def lookup_pinyin(letter: str) -> Optional[dict]:
    normalized = PINYIN_NORMALIZE.get(letter, letter)
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, ref_char, ref_pinyin, pinyin_type FROM pinyin_content WHERE pinyin_char = %s",
            (normalized,),
        )
        row = cur.fetchone()
    if row:
        return {"id": row[0], "ref_char": row[1], "ref_pinyin": row[2], "category": row[3]}
    return None

# ========== FastAPI ==========
app = FastAPI(title="拼音测评")

class EvaluateRequest(BaseModel):
    letter: str
    audio: str
    encoding: str = "lame"

class EvaluateResponse(BaseModel):
    passed: bool
    overall: float
    pronunciation: float
    tone: float
    integrity: float
    rhythm: float
    ref_char: str
    result_id: Optional[int] = None
    detail: Optional[dict] = None

@app.post("/api/evaluate", response_model=EvaluateResponse)
async def api_evaluate(req: EvaluateRequest):
    info = lookup_pinyin(req.letter)
    if not info:
        raise HTTPException(400, f"未知拼音: {req.letter}")

    result = await evaluator.evaluate(
        ref_text=info["ref_char"],
        ref_pinyin=info["ref_pinyin"],
        audio_b64=req.audio,
        encoding=req.encoding,
        slack=XF_CONFIG.get("slack", 0.0),
    )

    if not result:
        raise HTTPException(500, "评测无结果")

    r = result.get("result", result)
    overall = float(r.get("overall", 0))
    pronunciation = float(r.get("pronunciation", 0))
    tone = float(r.get("tone", 0))
    integrity = float(r.get("integrity", 0))
    rhythm = float(r.get("rhythm", 0))
    passed = overall >= 60

    # 存入数据库
    result_id = None
    normalized = PINYIN_NORMALIZE.get(req.letter, req.letter)
    try:
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute(
                """INSERT INTO evaluation_results
                    (ref_text, ref_pinyin, overall_score, pronunciation, tone_score,
                     integrity, rhythm, detail_json, passed, pinyin_char)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                (info["ref_char"], info["ref_pinyin"], overall, pronunciation, tone,
                 integrity, rhythm, json.dumps(result, ensure_ascii=False), passed, normalized),
            )
            result_id = cur.fetchone()[0]
            conn.commit()
    except Exception as e:
        print(f"[数据库] 存储失败: {e}")

    return EvaluateResponse(
        passed=passed, overall=overall, pronunciation=pronunciation,
        tone=tone, integrity=integrity, rhythm=rhythm,
        ref_char=info["ref_char"], result_id=result_id, detail=r,
    )

@app.get("/character-study.html")
async def serve_character_study():
    return FileResponse(os.path.join(FRONTEND_DIR, "character-study.html"), media_type="text/html")

@app.get("/api/character")
def api_character(id: Optional[int] = None):
    with get_db() as conn:
        cur = conn.cursor()
        if id is not None:
            cur.execute("SELECT id, char, pinyin, eval_pinyin FROM character_content WHERE id = %s", (id,))
        else:
            cur.execute("SELECT id, char, pinyin, eval_pinyin FROM character_content ORDER BY RANDOM() LIMIT 1")
        row = cur.fetchone()
    if not row:
        raise HTTPException(404, "未找到")
    return {"id": row[0], "char": row[1], "pinyin": row[2], "eval_pinyin": row[3]}

@app.get("/api/characters")
def api_list_characters():
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT id, char, pinyin, eval_pinyin FROM character_content ORDER BY id")
        rows = cur.fetchall()
    return [{"id": r[0], "char": r[1], "pinyin": r[2], "eval_pinyin": r[3]} for r in rows]

@app.get("/api/pinyin")
def api_list_pinyin():
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT pinyin_char, ref_char, ref_pinyin, pinyin_type FROM pinyin_content ORDER BY id")
        rows = cur.fetchall()
    return [{"pinyin": r[0], "ref_char": r[1], "ref_pinyin": r[2], "category": r[3]} for r in rows]

# ========== 静态文件 ==========
@app.get("/")
@app.get("/assessment.html")
async def serve_assessment():
    return FileResponse(os.path.join(FRONTEND_DIR, "assessment.html"), media_type="text/html")

app.mount("/", StaticFiles(directory=FRONTEND_DIR), name="static")

# ========== 启动 ==========
if __name__ == "__main__":
    PORT = 8080
    print("=" * 50)
    print("  拼音测评服务")
    print("=" * 50)
    print(f"  前端: {FRONTEND_DIR}")
    print(f"  后端: {BACKEND_DIR}")
    print(f"  数据库: {DB_CONFIG['dbname']}@{DB_CONFIG['host']}")
    print(f"  → http://localhost:{PORT}/assessment.html")
    print("=" * 50)
    uvicorn.run(app, host="0.0.0.0", port=PORT)