"""
讯飞语音评测 WebSocket 客户端（异步版）
基于 suntone API: wss://cn-east-1.ws-api.xf-yun.com/v1/private/s8e098720
"""
import asyncio
import base64
import hashlib
import hmac
import json
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import urlencode

import websockets


class XunfeiEvaluator:
    HOST = "cn-east-1.ws-api.xf-yun.com"
    PATH = "/v1/private/s8e098720"

    def __init__(self, app_id: str, api_key: str, api_secret: str):
        self.app_id = app_id
        self.api_key = api_key
        self.api_secret = api_secret

    def _build_url(self) -> str:
        date = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S GMT")
        request_line = f"GET {self.PATH} HTTP/1.1"
        sig_origin = f"host: {self.HOST}\ndate: {date}\n{request_line}"
        signature = base64.b64encode(
            hmac.new(
                self.api_secret.encode(), sig_origin.encode(), hashlib.sha256
            ).digest()
        ).decode()
        auth_origin = (
            f'api_key="{self.api_key}",algorithm="hmac-sha256",'
            f'headers="host date request-line",signature="{signature}"'
        )
        authorization = base64.b64encode(auth_origin.encode()).decode()
        params = urlencode(
            {"host": self.HOST, "date": date, "authorization": authorization}
        )
        return f"wss://{self.HOST}{self.PATH}?{params}"

    async def evaluate(
        self,
        ref_text: str,
        ref_pinyin: str,
        audio_b64: str,
        encoding: str = "lame",
        core: str = "sent",
        slack: float = 0.0,
        sample_rate: int = 16000,
        timeout: float = 30.0,
    ) -> Optional[dict]:
        """
        发送音频到讯飞评测 API，返回评测结果。

        Args:
            ref_text:    参考汉字（如 "波"）
            ref_pinyin:  参考拼音（如 "bo1"）
            audio_b64:   base64 编码的音频数据
            encoding:    音频编码（"lame" 表示 MP3）
            core:        评测模式（"sent"=句子）
            slack:       打分松紧度 [-1, 1]
            sample_rate: 采样率
            timeout:     超时时间（秒）

        Returns:
            评测结果 dict，或 None（失败时）
        """
        return await asyncio.wait_for(
            self._do_evaluate(ref_text, ref_pinyin, audio_b64, encoding, core, slack, sample_rate),
            timeout=timeout,
        )

    async def _do_evaluate(self, ref_text, ref_pinyin, audio_b64, encoding, core, slack, sample_rate):
        url = self._build_url()

        # 拆分音频到两帧（API 要求至少两帧）
        split_pos = max(1, len(audio_b64) - min(1000, len(audio_b64) // 10))
        audio1 = audio_b64[:split_pos]
        audio2 = audio_b64[split_pos:]

        result_text = ""

        async with websockets.connect(url) as ws:
            # 帧 1：开始帧 (status=0)，携带评测参数 + 音频主体
            frame1 = {
                "header": {"app_id": self.app_id, "status": 0},
                "parameter": {
                    "st": {
                        "lang": "cn",
                        "core": core,
                        "refText": ref_text,
                        "refPinyin": ref_pinyin,
                        "slack": slack,
                        "phoneme_output": 1,
                        "result": {
                            "encoding": "utf8",
                            "compress": "raw",
                            "format": "plain",
                        },
                    }
                },
                "payload": {
                    "data": {
                        "encoding": encoding,
                        "sample_rate": sample_rate,
                        "channels": 1,
                        "bit_depth": 16,
                        "status": 0,
                        "seq": 0,
                        "audio": audio1,
                    }
                },
            }
            await ws.send(json.dumps(frame1, ensure_ascii=False))

            # 帧 2：结束帧 (status=2)，携带剩余音频
            frame2 = {
                "header": {"app_id": self.app_id, "status": 2},
                "payload": {
                    "data": {
                        "encoding": encoding,
                        "sample_rate": sample_rate,
                        "channels": 1,
                        "bit_depth": 16,
                        "status": 2,
                        "seq": 1,
                        "audio": audio2,
                    }
                },
            }
            await ws.send(json.dumps(frame2, ensure_ascii=False))

            # 接收评测结果
            async for message in ws:
                resp = json.loads(message)
                code = resp["header"]["code"]
                if code != 0:
                    raise RuntimeError(
                        f"讯飞 API 错误 [{code}]: {resp['header'].get('message', '')}"
                    )
                payload = resp.get("payload", {})
                if payload.get("result", {}).get("text"):
                    result_text = payload["result"]["text"]
                if resp["header"]["status"] == 2:
                    break

        if not result_text:
            return None

        decoded = json.loads(base64.b64decode(result_text).decode("utf-8"))
        return decoded
