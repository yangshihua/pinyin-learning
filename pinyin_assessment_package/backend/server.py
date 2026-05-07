#!/usr/bin/env python3
"""
拼音测评后端服务器 (FastAPI)

功能：
  1. 提供 POST /api/evaluate 接口：前端发送音频 + 拼音字母 → 后端查表 → 讯飞评测 → 存库 → 返回分数
  2. 提供 GET /api/pinyin 查询拼音列表
  3. 提供 GET /api/stats/{letter} 查询某拼音的历史评测统计
  4. 静态文件服务（assessment.html、pinyin-grid.js、svg_output/ 等）

用法：
  python3 server.py
  浏览器打开 http://localhost:8080
"""
import json
import os
import traceback
from contextlib import contextmanager
from typing import Optional

import psycopg2
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from evaluator import XunfeiEvaluator

# ========== 路径 ==========
DIR = os.path.dirname(os.path.abspath(__file__))
PARENT = os.path.dirname(DIR)
CONFIG_PATH = os.path.join(DIR, "suntone_config.json")

# ========== 讯飞配置 ==========
with open(CONFIG_PATH, encoding="utf-8") as f:
    XF_CONFIG = json.load(f)

evaluator = XunfeiEvaluator(
    app_id=XF_CONFIG["app_id"],
    api_key=XF_CONFIG["api_key"],
    api_secret=XF_CONFIG["api_secret"],
)

# ========== 数据库 ==========
DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "pinyin_learning",
    "user": "balanceearnest",
}

# 前端显示字符 → 数据库拼音字符的映射
PINYIN_NORMALIZE = {"ɑ": "a"}


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
        return {
            "id": row[0],
            "ref_char": row[1],
            "ref_pinyin": row[2],
            "category": row[3],
        }
    return None


# ========== FastAPI ==========
app = FastAPI(title="拼音测评后端")


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

    print(f"[评测] 拼音={req.letter} → 参考字={info['ref_char']} 参考拼音={info['ref_pinyin']}")

    try:
        result = await evaluator.evaluate(
            ref_text=info["ref_char"],
            ref_pinyin=info["ref_pinyin"],
            audio_b64=req.audio,
            encoding=req.encoding,
            slack=XF_CONFIG.get("slack", 0.0),
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, f"讯飞评测失败: {e}")

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
                """
                INSERT INTO evaluation_results
                    (ref_text, ref_pinyin, overall_score, pronunciation, tone_score,
                     integrity, rhythm, detail_json, passed, pinyin_char)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (
                    info["ref_char"],
                    info["ref_pinyin"],
                    overall,
                    pronunciation,
                    tone,
                    integrity,
                    rhythm,
                    json.dumps(result, ensure_ascii=False),
                    passed,
                    normalized,
                ),
            )
            result_id = cur.fetchone()[0]
            conn.commit()
            print(f"[数据库] 已保存评测记录 id={result_id}, 得分={overall}, passed={passed}")
    except Exception as e:
        print(f"[数据库] 存储失败: {e}")

    return EvaluateResponse(
        passed=passed,
        overall=overall,
        pronunciation=pronunciation,
        tone=tone,
        integrity=integrity,
        rhythm=rhythm,
        ref_char=info["ref_char"],
        result_id=result_id,
        detail=r,
    )


@app.get("/api/pinyin")
def api_list_pinyin():
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT pinyin_char, ref_char, ref_pinyin, pinyin_type FROM pinyin_content ORDER BY id"
        )
        rows = cur.fetchall()
    return [
        {"pinyin": r[0], "ref_char": r[1], "ref_pinyin": r[2], "category": r[3]}
        for r in rows
    ]


@app.get("/api/stats/{letter}")
def api_stats(letter: str):
    normalized = PINYIN_NORMALIZE.get(letter, letter)
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT COUNT(*),
                   COUNT(*) FILTER (WHERE passed),
                   COALESCE(AVG(overall_score)::numeric(5,1), 0)
            FROM evaluation_results
            WHERE pinyin_char = %s
            """,
            (normalized,),
        )
        row = cur.fetchone()
    return {
        "pinyin": normalized,
        "total": row[0],
        "passed": row[1],
        "avg_score": float(row[2]),
    }


@app.get("/api/history")
def api_history(limit: int = 50):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT id, pinyin_char, ref_text, overall_score, passed, created_at
            FROM evaluation_results
            ORDER BY created_at DESC
            LIMIT %s
            """,
            (limit,),
        )
        rows = cur.fetchall()
    return [
        {
            "id": r[0],
            "pinyin": r[1],
            "ref_char": r[2],
            "score": float(r[3]) if r[3] else 0,
            "passed": r[4],
            "time": r[5].isoformat() if r[5] else None,
        }
        for r in rows
    ]


# ========== 静态文件 ==========
@app.get("/")
@app.get("/assessment.html")
async def serve_assessment():
    return FileResponse(
        os.path.join(PARENT, "assessment.html"), media_type="text/html"
    )


@app.get("/index.html")
async def serve_index():
    return FileResponse(os.path.join(PARENT, "index.html"), media_type="text/html")


app.mount("/", StaticFiles(directory=PARENT), name="static")


# ========== 启动 ==========
if __name__ == "__main__":
    PORT = 8080
    print("=" * 50)
    print("  拼音测评后端 (FastAPI + 讯飞 API)")
    print("=" * 50)
    print(f"  配置: {CONFIG_PATH}")
    print(f"  数据库: {DB_CONFIG['dbname']}@{DB_CONFIG['host']}")
    print(f"  → http://localhost:{PORT}")
    print(f"  → Ctrl+C 停止")
    print("=" * 50)
    uvicorn.run(app, host="0.0.0.0", port=PORT)
