"""豆包 TTS — 每次独立连接，避免长连接状态污染"""
import array, asyncio, uuid
import websockets
from config import TTS_WSS_URL, TTS_SPEAKER, get_tts_headers
import protocol_tts as P


async def tts_synthesize(text: str) -> bytes:
    connect_id = str(uuid.uuid4())
    session_id = str(uuid.uuid4())
    headers = get_tts_headers()

    ws = await websockets.connect(TTS_WSS_URL, additional_headers=headers, max_size=10*1024*1024)
    try:
        # 建连
        await ws.send(P.build_client_event(P.EVENT_START_CONNECTION))
        resp = await asyncio.wait_for(ws.recv(), timeout=5)
        _, ev, _, _, _ = P.parse_server_frame(resp)
        if ev != P.EVENT_CONNECTION_STARTED:
            raise RuntimeError(f"Expected CONNECTION_STARTED, got {ev}")

        # 开 session
        session_params = {"req_params": {"speaker": TTS_SPEAKER, "audio_params": {"format": "pcm", "sample_rate": 24000}}}
        await ws.send(P.build_client_event(P.EVENT_START_SESSION, session_params, connect_id=connect_id))
        resp = await asyncio.wait_for(ws.recv(), timeout=5)
        _, ev, sid, _, _ = P.parse_server_frame(resp)
        if ev != P.EVENT_SESSION_STARTED:
            raise RuntimeError(f"Expected SESSION_STARTED, got {ev}")
        if sid:
            session_id = sid

        # 发文本
        await ws.send(P.build_task_request(text, session_id))
        await ws.send(P.build_client_event(P.EVENT_FINISH_SESSION, session_id=session_id))

        # 收音频
        audio_chunks = []
        async for raw in ws:
            if not isinstance(raw, bytes):
                continue
            _, ev, _, _, audio = P.parse_server_frame(raw)
            if audio:
                f32 = array.array("f"); f32.frombytes(audio)
                i16 = array.array("h", (max(-32768, min(32767, int(s * 32768))) for s in f32))
                audio_chunks.append(i16.tobytes())
            if ev in (P.EVENT_TTS_ENDED, P.EVENT_SESSION_FINISHED):
                break

        return b"".join(audio_chunks)
    finally:
        await ws.close()
