"""豆包 ASR WebSocket 客户端 — 输入 PCM bytes，返回识别文本

协议: 大模型流式语音识别 API (Sauc binary protocol)
Endpoint: wss://openspeech.bytedance.com/api/v3/sauc/bigmodel

与 TTS 协议的关键差异:
- ASR 没有 Event 机制，TTS 有 (flags=0x4 with event number)
- ASR server response 在 header 后有 4 字节 Sequence 字段
- ASR audio-only request 用 flags 区分最后一包 (flags=0x2 = last packet)
"""
import asyncio, gzip, json, struct, uuid
import websockets
from config import ASR_WSS_URL, get_asr_headers

PROTOCOL_VERSION = 1
HEADER_SIZE = 1  # in 4-byte units

MSG_FULL_REQUEST = 0x1
MSG_AUDIO_ONLY = 0x2
MSG_SERVER_FULL_RESPONSE = 0x9
MSG_SERVER_ERROR = 0xF

# ASR flags (different from TTS FLAG_WITH_EVENT=0x4)
FLAG_NO_SEQ = 0x0       # 无 sequence number
FLAG_POS_SEQ = 0x1      # 有正数 sequence number
FLAG_LAST_NO_SEQ = 0x2  # 最后一包，无 sequence number
FLAG_NEG_SEQ = 0x3      # 最后一包，负数 sequence number

SERIAL_NONE = 0x0
SERIAL_JSON = 0x1
COMPRESS_NONE = 0x0
COMPRESS_GZIP = 0x1


def _build_header(msg_type: int, serial: int = SERIAL_NONE, compress: int = COMPRESS_NONE, flags: int = 0) -> bytes:
    b0 = (PROTOCOL_VERSION << 4) | HEADER_SIZE
    b1 = (msg_type << 4) | flags
    b2 = (serial << 4) | compress
    b3 = 0x00
    return bytes([b0, b1, b2, b3])


def _build_binary_frame(msg_type: int, payload: bytes, serial: int = SERIAL_NONE, compress: int = COMPRESS_NONE, flags: int = 0) -> bytes:
    header = _build_header(msg_type, serial, compress, flags)
    return header + struct.pack(">I", len(payload)) + payload


def _build_json_frame(msg_type: int, payload_dict: dict, flags: int = 0) -> bytes:
    payload = json.dumps(payload_dict, ensure_ascii=False).encode("utf-8")
    compressed = gzip.compress(payload)
    return _build_binary_frame(msg_type, compressed, serial=SERIAL_JSON, compress=COMPRESS_GZIP, flags=flags)


def _parse_response(data: bytes) -> dict:
    """Parse a binary server response frame, return JSON dict or empty dict.

    Server response format: Header(4B) | Sequence(4B) | PayloadSize(4B) | Payload
    Error response format:  Header(4B) | ErrorCode(4B) | ErrorMsgSize(4B) | ErrorMsg
    """
    if len(data) < 8:
        return {}
    msg_type = (data[1] >> 4) & 0xF
    flags = data[1] & 0xF
    serial = (data[2] >> 4) & 0xF
    compress = data[2] & 0xF

    offset = 4

    if msg_type == MSG_SERVER_ERROR:
        # Error frame: ErrorCode(4B) | ErrorMsgSize(4B) | ErrorMsg(UTF8)
        if offset + 8 > len(data):
            return {}
        error_code = struct.unpack(">I", data[offset:offset + 4])[0]
        offset += 4
        msg_len = struct.unpack(">I", data[offset:offset + 4])[0]
        offset += 4
        if offset + msg_len > len(data):
            return {}
        error_msg = data[offset:offset + msg_len].decode("utf-8", errors="replace")
        return {"error": True, "code": error_code, "message": error_msg}

    # Full server response (0x9): skip sequence number if flags indicate it
    if flags & 0x1:  # FLAG_POS_SEQ or FLAG_NEG_SEQ
        if offset + 4 > len(data):
            return {}
        offset += 4  # skip sequence number

    if offset + 4 > len(data):
        return {}
    payload_len = struct.unpack(">I", data[offset:offset + 4])[0]
    offset += 4
    if offset + payload_len > len(data):
        return {}
    raw = data[offset:offset + payload_len]

    if compress == COMPRESS_GZIP and raw:
        try:
            raw = gzip.decompress(raw)
        except Exception:
            pass

    if serial == SERIAL_JSON and raw:
        try:
            return json.loads(raw)
        except Exception:
            pass

    return {}


async def asr_recognize(pcm_bytes: bytes) -> str:
    headers = get_asr_headers()
    result_text = ""

    async with websockets.connect(ASR_WSS_URL, additional_headers=headers) as ws:
        # 1. Full Client Request (JSON config, gzip compressed)
        config = {
            "user": {"uid": str(uuid.uuid4())},
            "audio": {"format": "pcm", "rate": 16000, "bits": 16, "channel": 1, "language": "zh-CN"},
            "request": {"model_name": "bigmodel", "enable_itn": True, "enable_punc": True,
                        "enable_ddc": False, "result_type": "single"},
        }
        await ws.send(_build_json_frame(MSG_FULL_REQUEST, config))

        # 2. Send audio chunks (200ms per chunk = 6400 bytes @ 16kHz 16bit mono)
        chunk_size = 6400
        total = len(pcm_bytes)
        offset = 0
        while offset < total:
            chunk = pcm_bytes[offset:offset + chunk_size]
            offset += len(chunk)
            is_last = offset >= total
            flags = FLAG_LAST_NO_SEQ if is_last else FLAG_NO_SEQ
            frame = _build_binary_frame(MSG_AUDIO_ONLY, chunk, flags=flags)
            await ws.send(frame)
            await asyncio.sleep(0.02)

        # 3. Receive results
        async for raw in ws:
            if isinstance(raw, bytes):
                resp = _parse_response(raw)
                if resp.get("error"):
                    break
                text = resp.get("result", {}).get("text")
                if text:
                    result_text = text
                if resp.get("is_final"):
                    break
            elif isinstance(raw, str):
                try:
                    msg = json.loads(raw)
                    text = msg.get("result", {}).get("text")
                    if text:
                        result_text = text
                    if msg.get("is_final") or msg.get("code", 0) != 0:
                        break
                except Exception:
                    pass

    return result_text
