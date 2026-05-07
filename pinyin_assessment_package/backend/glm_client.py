"""DeepSeek V4 Pro 调用 — 支持流式输出"""
import json as _json
import httpx
from config import DEEPSEEK_BASE_URL, DEEPSEEK_API_KEY, DEEPSEEK_MODEL


async def glm_chat(prompt: str, system: str = "") -> str:
    """流式调用，快速返回完整文本"""
    chunks = []
    async for chunk in glm_chat_stream(prompt, system):
        chunks.append(chunk)
    return "".join(chunks)


async def glm_chat_stream(prompt: str, system: str = ""):
    """流式调用，异步生成器逐块返回文本"""
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    async with httpx.AsyncClient(timeout=60) as client:
        async with client.stream(
            "POST",
            f"{DEEPSEEK_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": DEEPSEEK_MODEL,
                "messages": messages,
                "max_tokens": 1024,
                "stream": True,
                "thinking": {"type": "disabled"},
            },
        ) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if line.startswith("data: "):
                    data = line[6:]
                    if data == "[DONE]":
                        break
                    try:
                        chunk = _json.loads(data)
                        delta = chunk.get("choices", [{}])[0].get("delta", {})
                        content = delta.get("content", "")
                        if content:
                            yield content
                    except _json.JSONDecodeError:
                        pass
