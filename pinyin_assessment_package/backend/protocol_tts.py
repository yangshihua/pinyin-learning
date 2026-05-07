"""Doubao WebSocket 双向流式-V3 TTS binary protocol.

Endpoint: wss://openspeech.bytedance.com/api/v3/tts/bidirection

Frame structure:
    Header(4B) + Event(4B) + [ConnectId] + [SessionId] + PayloadLen(4B) + Payload
"""
import gzip
import json
import struct
from typing import Optional, Tuple

PROTOCOL_VERSION = 1
HEADER_SIZE = 1  # 1 * 4 = 4 bytes

MSG_CLIENT_FULL_REQUEST = 0x1
MSG_SERVER_FULL_RESPONSE = 0x9
MSG_SERVER_AUDIO_RESPONSE = 0xB
MSG_SERVER_ERROR = 0xF

FLAG_WITH_EVENT = 0x4

SERIAL_JSON = 0x1
SERIAL_RAW = 0x0
COMPRESS_GZIP = 0x1
COMPRESS_NONE = 0x0

# --- Client events ---
EVENT_START_CONNECTION = 1
EVENT_FINISH_CONNECTION = 2
EVENT_START_SESSION = 100
EVENT_FINISH_SESSION = 102
EVENT_TASK_REQUEST = 200

# --- Server events ---
EVENT_CONNECTION_STARTED = 50
EVENT_CONNECTION_FINISHED = 52
EVENT_SESSION_STARTED = 150
EVENT_SESSION_FINISHED = 152
EVENT_TTS_RESPONSE = 352
EVENT_TTS_ENDED = 359

CONNECTION_EVENTS = {
    EVENT_START_CONNECTION,
    EVENT_CONNECTION_STARTED,
    EVENT_FINISH_CONNECTION,
    EVENT_CONNECTION_FINISHED,
}

SESSION_EVENTS = {
    EVENT_SESSION_STARTED,
    EVENT_SESSION_FINISHED,
}


def _build_header(msg_type: int, serialization: int, compression: int) -> bytes:
    b0 = (PROTOCOL_VERSION << 4) | HEADER_SIZE
    b1 = (msg_type << 4) | FLAG_WITH_EVENT
    b2 = (serialization << 4) | compression
    b3 = 0x00
    return bytes([b0, b1, b2, b3])


def build_client_event(
    event_id: int,
    payload_dict: Optional[dict] = None,
    connect_id: str = "",
    session_id: str = "",
) -> bytes:
    """Build a client event frame. Generic for all TTS client events."""
    header = _build_header(MSG_CLIENT_FULL_REQUEST, SERIAL_JSON, COMPRESS_GZIP)

    body = struct.pack(">I", event_id)

    # Connection events (1, 2) have no extra IDs
    if event_id in (EVENT_START_CONNECTION, EVENT_FINISH_CONNECTION):
        pass  # no connect_id or session_id
    elif event_id == EVENT_START_SESSION:
        # StartSession carries connect_id (not session_id)
        cid_bytes = connect_id.encode("utf-8") if connect_id else b""
        body += struct.pack(">I", len(cid_bytes))
        if cid_bytes:
            body += cid_bytes
    else:
        # Session-level events (TaskRequest, FinishSession) carry session_id
        sid_bytes = session_id.encode("utf-8") if session_id else b""
        body += struct.pack(">I", len(sid_bytes))
        if sid_bytes:
            body += sid_bytes

    payload_json = json.dumps(payload_dict or {}, ensure_ascii=False).encode("utf-8")
    compressed = gzip.compress(payload_json)
    body += struct.pack(">I", len(compressed)) + compressed
    return header + body


def build_task_request(text: str, session_id: str) -> bytes:
    """Build a TaskRequest frame with the text to synthesize."""
    payload = {"req_params": {"text": text}}
    return build_client_event(EVENT_TASK_REQUEST, payload, session_id=session_id)


def parse_server_frame(data: bytes) -> Tuple[int, int, str, Optional[dict], Optional[bytes]]:
    """Parse a server frame.

    Returns (msg_type, event_id, session_id, json_payload, audio_bytes).
    """
    if len(data) < 8:
        return 0, 0, "", None, None

    b1 = data[1]
    b2 = data[2]
    msg_type = (b1 >> 4) & 0xF
    serialization = (b2 >> 4) & 0xF
    compression = b2 & 0xF

    offset = 4
    event_id = struct.unpack(">I", data[offset:offset + 4])[0]
    offset += 4

    session_id = ""
    # Parse session_id for session-level events
    is_session_event = event_id not in CONNECTION_EVENTS and event_id not in (
        EVENT_START_SESSION,
        EVENT_CONNECTION_STARTED,
        EVENT_CONNECTION_FINISHED,
    )
    if is_session_event and offset + 4 <= len(data):
        sid_len = struct.unpack(">I", data[offset:offset + 4])[0]
        offset += 4
        if sid_len > 0 and offset + sid_len <= len(data):
            session_id = data[offset:offset + sid_len].decode("utf-8", errors="replace")
            offset += sid_len

    if offset >= len(data):
        return msg_type, event_id, session_id, None, None

    payload_len = struct.unpack(">I", data[offset:offset + 4])[0]
    offset += 4
    raw_payload = data[offset:offset + payload_len]

    if compression == COMPRESS_GZIP and raw_payload:
        try:
            raw_payload = gzip.decompress(raw_payload)
        except Exception:
            pass

    # Audio-only response (0xB): binary PCM audio data → convert to Float32
    if msg_type == MSG_SERVER_AUDIO_RESPONSE:
        audio_bytes = _convert_pcm16_to_float32(raw_payload)
        return msg_type, event_id, session_id, None, audio_bytes

    # JSON response
    if serialization == SERIAL_JSON and raw_payload:
        try:
            return msg_type, event_id, session_id, json.loads(raw_payload), None
        except Exception:
            return msg_type, event_id, session_id, None, raw_payload

    return msg_type, event_id, session_id, None, raw_payload


def _convert_pcm16_to_float32(pcm16_data: bytes) -> bytes:
    """Convert Int16 PCM bytes to Float32 PCM bytes for frontend playback."""
    import array
    samples = array.array("h")
    samples.frombytes(pcm16_data)
    float32 = array.array("f", (s / 32768.0 for s in samples))
    return float32.tobytes()
