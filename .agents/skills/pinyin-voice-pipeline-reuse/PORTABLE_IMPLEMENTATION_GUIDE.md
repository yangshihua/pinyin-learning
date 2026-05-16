# Portable Implementation Guide (Cross-Project)

This guide is specifically for your scenario: **new project in another folder, cannot reference this repo paths**.

You should treat this package as a **protocol + contract kit**, not as path-based imports.

---

## 1. What to copy into a new project

Copy this entire folder to your target project:

`pinyin-voice-pipeline-reuse/`

Then implement modules with your own file names, as long as they satisfy the contracts:

- Session Gateway
- ASR Adapter
- LLM Dialog Brain
- TTS Adapter
- Tool Dispatcher
- iFlytek Evaluator
- Doubao Image Generator

---

## 2. Hard contracts you must keep

### 2.1 Frame & message contracts

- binary frame up audio: `0x01`
- binary frame down audio: `0x02`
- binary frame up image: `0x03`

Text messages minimum:

- `asr_text`
- `agent_text`
- `assessment_result`
- `drawing_generated`

### 2.2 Tool names (exact match)

- `evaluate_pronunciation`
- `generate_img2img`
- `open_drawing_board`
- `get_drawing`
- `save_drawing`
- `goto_next_phase`

### 2.3 Standard output schemas

Pronunciation:

```json
{
  "overall": 82,
  "pronunciation": 80,
  "tone": 84,
  "integrity": 81,
  "passed": true,
  "weak_phonemes": ["tone_3"]
}
```

Image generation:

```json
{
  "url": "https://...",
  "status": "ok",
  "error": "",
  "message": ""
}
```

---

## 3. Doubao img2img (Ark) + OSS bridge

Use this API:

- `POST https://ark.cn-beijing.volces.com/api/v3/images/generations`

Recommended payload:

```json
{
  "model": "doubao-seedream-5-0-260128",
  "prompt": "...",
  "image": "<OSS_PUBLIC_URL>",
  "sequential_image_generation": "disabled",
  "response_format": "url",
  "size": "2K",
  "stream": false,
  "watermark": true
}
```

Why OSS first:
- Ark `image` works more reliably with public URL
- easier retries and audit
- can persist user sketch & generated image independently

---

## 4. iFlytek evaluator contract

Keep the evaluator as an async boundary:

```ts
evaluate_async(ref_text, ref_pinyin, audio_bytes) -> raw_result
parse_eval_result(raw_result) -> standard schema
```

Your downstream agent/UI should only consume standardized schema.

---

## 5. Drop-in migration sequence (do in order)

1. ASR only (audio in -> text out)
2. LLM stream only (text in -> sentence/tool events)
3. TTS only (sentence in -> audio out)
4. add evaluator tool
5. add image generation tool

Do not integrate all at once.

---

## 6. Non-security pitfalls (critical)

1. Sentence chunking too aggressive causes choppy TTS.
2. `_pcm_buffer` lifecycle bugs cause fake "too short" evaluations.
3. Drawing base64 missing or cleared too early causes fake image failures.
4. Tool name mismatch breaks business silently.
5. No unified status enum makes frontend state handling fragile.

Recommended status enum:
- `ok`
- `waiting`
- `unconfigured`
- `error`
