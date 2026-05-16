---
name: pinyin-voice-pipeline-reuse
version: 0.1.0
description: Reuse-ready backend implementation guide for ASR→LLM→TTS, iFlytek evaluation, and Doubao img2img in new projects.
category: backend
subcategory: voice-multimodal-pipeline
author: project-internal
license: Proprietary
allowed_tools:
  - read
  - grep
  - glob
  - write
  - bash
supported_agents:
  - codex
  - Codex
  - cursor
tags:
  - asr
  - tts
  - llm
  - xunfei
  - doubao
  - websocket
---

# Goal
把当前项目的“语音学习后端能力”迁移到其他项目时，确保一次性对齐协议、状态机、工具调用契约和云服务参数，减少联调返工。

# Use When
- 你要复用 ASR→LLM→TTS 全链路
- 你要复用 讯飞语音测评（evaluate_pronunciation）
- 你要复用 豆包图生图（generate_img2img）
- 你要把这一套改造成新业务但保留基础框架

# Core Architecture（必须先建立）
1. WebSocket 会话入口（Session Gateway）
2. ASR 客户端（Speech In Adapter）
3. LLM 路由与 Agent（Dialog Brain）
4. TTS 客户端（Speech Out Adapter）
5. 工具调用分发中心（Tool Dispatcher）
6. 可选能力：
   - 讯飞评测（Pronunciation Evaluator）
   - 豆包图生图（Image Generator）

# Migration Workflow（按顺序执行）
1. 先跑通“音频上行→ASR 文本回传”
2. 再接“ASR final → LLM sentence 回流”
3. 再接“TTS 合成与下行播放”
4. 再接“工具调用 evaluate_pronunciation”
5. 最后接“工具调用 generate_img2img”

不要一上来全接，否则定位问题会非常慢。

# Contract Checklist（关键契约）

## A. 前后端事件/帧契约
- 上行音频帧类型：`0x01`
- 下行语音帧类型：`0x02`
- 图像上传帧类型：`0x03`
- 文本消息最少要有：
  - `asr_text`
  - `agent_text`
  - `assessment_result`
  - `drawing_generated`

## B. 工具调用契约（名字要完全一致）
- `evaluate_pronunciation`
- `generate_img2img`
- `open_drawing_board`
- `get_drawing`
- `save_drawing`
- `goto_next_phase`

## C. 音频参数契约
- ASR：16k / 16bit / mono PCM
- 讯飞评测：默认 lame(MP3) + 16k
- TTS：服务侧 24k PCM，后端转 Float32 下发

# Doubao Img2Img Reuse（关键点）
1. 实现入口：你的 Image Generator 适配器（函数名建议保留 `generate_img2img`）
2. HTTP：`POST https://ark.cn-beijing.volces.com/api/v3/images/generations`
3. Header：`Authorization: Bearer {DOUBAO_IMAGE_API_KEY}`
4. Body 最少字段：`model`, `prompt`, `image`
5. 推荐字段：
   - `model=doubao-seedream-5-0-260128`
   - `sequential_image_generation=disabled`
   - `response_format=url`
   - `size=2K`
   - `stream=false`
   - `watermark=true`
6. 返回统一结构：`url/status/error/message`

如果你在新项目替换为其他图生图供应商，也要保持这个返回结构，前端可零改动复用。

## OSS Bridge（建议作为固定中间层）
在生产项目里，`image` 建议传可访问 URL，而不是直接 base64。推荐流程：

1. 画板 base64 上传 OSS
2. 用 OSS URL 调豆包图生图
3. 得到生成图 URL 后按需二次入 OSS

迁移时至少准备这些配置：
- `OSS_REGION`
- `OSS_BUCKET`
- `OSS_ACCESS_KEY_ID`
- `OSS_ACCESS_KEY_SECRET`
- `DOUBAO_IMAGE_API_KEY`

# iFlytek Evaluation Reuse（关键点）
1. 入口：你的 Pronunciation Evaluator 异步方法（函数名建议保留 `evaluate_async`）
2. 签名：HMAC-SHA256，query 带 `host/date/authorization`
3. 当前服务是“双帧上传”策略：status=0 + status=2
4. 结果解析统一成：
   - `overall`
   - `pronunciation`
   - `tone`
   - `integrity`
   - `passed`
   - `weak_phonemes`

新项目一定要沿用这个标准输出，Agent 层和 UI 层可以无缝复用。

# Non-Security Pitfalls（非安全注意事项）
1. **分句策略**：分句太碎会导致 TTS 抢话、停顿异常。
2. **上下文生命周期**：
   - 评测依赖 `_pcm_buffer`
   - 生图依赖 `agent._drawing_data` 与 OSS URL 生成成功
   任何提前清空都会导致功能假失败。
3. **状态机一致性**：phase 名称变化要同步 Router、Agent Prompt、前端。
4. **工具名变更风险**：名字改了但分发没改，会出现“模型看起来调用了工具但业务没反应”。
5. **接口超时设计**：图生图/评测是慢调用，UI 需要“处理中”状态。
6. **错误语义统一**：建议固定 `ok / waiting / unconfigured / error`。

# Recommended Module Mapping（跨项目通用）
- `session_gateway.*`：WebSocket 会话与帧收发
- `speech_in_adapter.*`：ASR 建连、送音频、回调文本
- `dialog_brain.*`：LLM 流式响应、分句、工具调用
- `speech_out_adapter.*`：TTS 建连、送文本、回调音频
- `tool_dispatcher.*`：工具名到业务函数的分发
- `pronunciation_evaluator.*`：讯飞评测封装
- `image_generator.*`：豆包图生图封装
- `config.*`：环境变量和模型参数

# Portability Notes（你提到的“其他文件夹看不到本仓库代码”）
这份 skill 已按“无仓库路径依赖”设计。你在新项目里只要满足下列接口契约即可：

1. Tool Dispatcher 支持这些工具名：
   - `evaluate_pronunciation`
   - `generate_img2img`
   - `open_drawing_board`
   - `get_drawing`
   - `save_drawing`
   - `goto_next_phase`
2. Session Gateway 能收发：`0x01/0x02/0x03` + 文本消息
3. Evaluator 输出统一结构：
   - `overall/pronunciation/tone/integrity/passed/weak_phonemes`
4. Image Generator 输出统一结构：
   - `url/status/error/message`

# Definition of Done
完成迁移后，至少跑通这 4 条用例：
1. 孩子说话 → 实时识别文本
2. 识别最终句 → 模型回复 + TTS 播放
3. 触发评测 → 返回 `assessment_result`
4. 上传画作并触发生图 → 返回 `drawing_generated.url`
