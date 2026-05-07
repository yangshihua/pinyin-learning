# 拼音学习 App — 前端使用说明

## 目录结构

```
拼音学习/
├── index.html              # 【主入口】三态交互应用：欢迎 → 教学 → 画板
├── assessment.html         # 【测评】发音测评页：按住麦克风说话 → 机器人评分反馈
├── pinyin-grid.js          # <pinyin-grid> Web Component，渲染拼音格
├── pinyin-tone.js          # <pinyin-tone> Web Component，渲染声调符号
├── letter-config.js        # 字母布局配置（tx, ty, scale）
├── tone-config.js          # 声调布局配置
├── manifest.json           # PWA 配置
├── svg_output/             # 拼音字母 SVG 素材（35个文件）
│   ├── b.svg, p.svg ...    # 声母/韵母 SVG
│   ├── 一声调.svg ...      # 声调符号
│   └── ī.svg, í.svg ...   # 带调字母
├── voice/                  # 音频资源
│   └── z_voice_teacher.mp3
├── _docs/                  # 设计文档（非必须）
│   ├── SKILL.md
│   └── RobotAvatar_Readme.md
└── _archive/               # 历史/调试页面（可忽略）
    ├── teaching.html
    ├── welcome.html
    ├── stroke-guide.html
    └── ...
```

## 启动方式

由于组件通过 `fetch` 动态加载 `svg_output/` 下的 SVG 文件，**必须通过 HTTP 服务器运行**：

```bash
cd /Users/balanceearnest/Desktop/AI_CODING/拼音学习
python3 -m http.server 8899
```

访问 `http://localhost:8899/index.html`

> `file://` 协议下 SVG 无法加载。

---

## 主应用架构（index.html）

### 三态流程

应用使用 CSS class 切换实现三个状态：

| 状态 | CSS class | 触发方式 | 说明 |
|------|-----------|----------|------|
| 欢迎 | `.welcome` | 初始状态 | 机器人居中，拼音卡片隐藏 |
| 教学 | `.teaching` | 1.5s 后自动切换 | 机器人左移缩小，卡片居中显示毛玻璃大卡，4s 自动轮播字母 |
| 画板 | `.drawing` | 点击教学卡片 | 机器人移到左下，卡片缩小为左上角缩略图，画板工具和画布渐入 |

### 状态控制（JS 接口）

后端或 AI Agent 可通过以下方式控制应用状态：

```javascript
// 获取应用实例
const app = document.getElementById('app');

// 切换到教学状态（跳过欢迎动画）
app.classList.replace('welcome', 'teaching');

// 切换到画板状态
app.classList.replace('teaching', 'drawing');

// 直接设置目标状态
app.className = 'teaching';
```

### 字母控制

```javascript
const grid = document.getElementById('pinyinGrid');

// 切换当前展示的字母
grid.setAttribute('letter', 'b');
grid.setAttribute('letter', 'zh');
grid.setAttribute('letter', 'ɑ');
```

支持的字母列表（共 35 个）：
```
b, p, m, f, d, t, n, l, g, k, h, j, q, x,
zh, ch, sh, r, z, c, s, y, w,
ɑ, o, e, i, u, ü,
ī, í, ǐ, ì
```

### 自动轮播

教学状态下默认每 4 秒轮播下一个字母。可通过以下方式控制：

```javascript
// 停止自动轮播
clearInterval(autoTimer);

// 手动播放下一个
nextLetter();
```

---

## 测评页面（assessment.html）

### 交互流程

```
加载页面 → 展示拼音卡片 + 机器人指引（同教学态表情）
       → 按住麦克风 → 声波动画 + 音量条跳动 → 松手
       → 1.4s 等待（模拟评测）
       ├── 优秀：机器人鼓掌 + 金色特效 + 撒花🎊 → 2.8s 后自动下一字母
       └── 不对：机器人垂手 + 悲伤表情 + 摇头   → 2.2s 后自动重置重试
```

**无弹窗卡片** — 结果完全通过机器人表情和撒花特效表达，后续接入语音给孩子反馈。

### 操作方式

| 操作 | 功能 |
|------|------|
| **按住** 右下角麦克风按钮 | 开始录音，麦克风周围出现声波扩散动画 |
| **说话** | 音量可视化条跳动（模拟录音反馈） |
| **松开** | 触发评测（演示版 1.4s 后随机结果，后端接入后替换为真实语音识别） |
| 键盘 **P** | 开发调试：强制通过 |
| 键盘 **F** | 开发调试：强制失败 |

### 机器人表情状态

待读状态（`.state-ready`）的机器人与教学态一致：右手指向卡片、眼睛看向卡片、笑脸。
结果状态完成后自动恢复待读。

| 状态 | CSS class | 机器人表现 | 持续时间 |
|------|-----------|-----------|----------|
| 待读 | `.state-ready` | 右手指向卡片、眼睛看向卡片、笑脸浮动 | 等待操作 |
| 录音中 | `.state-listening` | 同待读态（交互焦点在麦克风动画） | 按住期间 |
| 优秀 | `.result-pass` | 双手鼓掌👏、金色星星眼✨、大笑脸😄、头顶金光、撒花🎊 | 2.8s 后自动下一字母 |
| 不对 | `.result-fail` | 双手下垂、眼睛变暗、悲伤嘴型、轻轻摇头 | 2.2s 后自动重试 |

### 替换后端语音识别

当前演示版使用 `Math.random() < 0.6` 模拟结果：

```javascript
// 在 stopListening() 中找到约第 100 行的代码：
var passed = Math.random() < 0.6;

// 替换为真实 API 调用：
const audioBlob = /* 通过 MediaRecorder 获取的录音 Blob */;
const formData = new FormData();
formData.append('audio', audioBlob, 'recording.webm');
formData.append('letter', letters[currentIdx]);

fetch('/api/pronunciation/check', {
  method: 'POST',
  body: formData
})
.then(r => r.json())
.then(data => showResult(data.passed));
```

### 状态监听（后端/Agent）

应用通过 `app.className` 切换状态，可用 MutationObserver 监听：

```javascript
const app = document.getElementById('app');
new MutationObserver(() => {
  if (app.classList.contains('result-pass')) {
    console.log('评测通过:', letters[currentIdx]);
  }
  if (app.classList.contains('result-fail')) {
    console.log('评测失败:', letters[currentIdx]);
  }
}).observe(app, { attributes: true, attributeFilter: ['class'] });
```

### 自定义配置

| 参数 | 位置 | 说明 |
|------|------|------|
| 字母列表 | `letters` 数组 (JS) | 默认 28 个声母韵母，可增删 |
| 通过率阈值 | `showResult` 调用参数 | 演示版随机；后端替换后由 API 决定 |
| 结果停留时间 | `setTimeout(nextLetter, 2800)` | 优秀展示时长 |
| 重试等待时间 | `setTimeout(retryLetter, 2200)` | 不对展示时长 |
| 机器人横向偏移 | CSS `.robot-area` `calc(-50% - 360px)` | 调整机器人与卡片的间距 |


### `<pinyin-grid>`

渲染拼音字母在四线三格中。

```html
<pinyin-grid letter="z" base-path="svg_output"></pinyin-grid>
```

**属性：**

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `letter` | string | 必填 | 拼音字母，对应 `svg_output/{letter}.svg` |
| `base-path` | string | `svg_output` | SVG 目录路径 |
| `line-color` | string | `#4A90D9` | 拼音格线条颜色 |
| `letter-color` | string | `#1a1a1a` | 字母填充颜色 |

### `<pinyin-tone>`

渲染声调符号在拼音格上格。

```html
<pinyin-tone tone="一声调" base-path="svg_output"></pinyin-tone>
```

**属性：**

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `tone` | string | 必填 | `一声调` / `二声调` / `三声调` / `四声调` |
| `base-path` | string | `svg_output` | SVG 目录路径 |

---

## 画板功能

### 获取画作数据

画板使用 HTML5 Canvas，画完后可通过以下方式获取图像数据：

```javascript
const canvas = document.getElementById('drawCanvas');

// 获取 Base64 PNG
const dataURL = canvas.toDataURL('image/png');

// 获取 Blob（适合上传）
canvas.toBlob(function(blob) {
  // 上传到后端
  const formData = new FormData();
  formData.append('drawing', blob, 'drawing.png');
  fetch('/api/upload-drawing', { method: 'POST', body: formData });
}, 'image/png');
```

### 清除画板

双击画布可清除；也支持编程调用：

```javascript
// 在控制台调用清除
document.getElementById('drawCanvas').dispatchEvent(new Event('dblclick'));
```

### 颜色选择

内置 8 种颜色：红色、橙色、黄色、绿色、青色、蓝色、紫色、黑色。点击色块切换。

---

## 后端集成建议

### 需要的 API 接口

应用当前是纯前端，以下 API 需要后端/Agent 提供：

| 接口 | 用途 | 调用时机 |
|------|------|----------|
| `POST /api/pronunciation/check` | 语音识别 + 发音评测 | 教学环节，孩子读完拼音后 |
| `POST /api/drawing/generate` | 画作 → AI 涂鸦生成 | 画板环节，孩子画完后 |
| `GET /api/audio/{letter}.mp3` | 播放拼音发音音频 | 教学环节 |
| `GET /api/progress/{userId}` | 获取学习进度 | 应用启动时 |
| `POST /api/progress/{userId}` | 保存学习进度 | 每完成一个拼音学习 |
| `POST /api/plan` | 生成学习计划 | 首次使用 / 复习周期 |

### AI Agent 交互流程

推荐的后端驱动流程：

```
后端/AI Agent → 控制前端状态 → 等待用户操作 → 获取结果 → 继续下一步

示例：
1. Agent 设置 app.className = 'teaching'
2. Agent 设置 grid.setAttribute('letter', 'b')
3. Agent 调用 audio API 播放 "b" 的发音
4. 孩子跟着读 → 调用语音评测 API
5. 评测通过 → Agent 设置 grid.setAttribute('letter', 'p')
6. ...循环...
7. Agent 设置 app.className = 'drawing'
8. 孩子画画 → 点击 card 获取画作 → 调用画作生成 API
```

### 事件通知（建议）

建议在 `index.html` 中添加 CustomEvent，让后端/Agent 能监听状态变化：

```javascript
// 状态变更时派发事件
document.getElementById('app').addEventListener('class-change', function(e) {
  console.log('State changed:', e.detail);
});

// 画作用户确认
const card = document.getElementById('card');
card.addEventListener('click', () => {
  // 通知后端：孩子已进入画板模式
});
```

---

## 资源规范

### SVG 素材（svg_output/）

| 类型 | 数量 | 命名规则 |
|------|------|----------|
| 声母 | 23 | `b.svg`, `p.svg`, `zh.svg` ... |
| 单韵母 | 5 | `ɑ.svg`, `o.svg`, `e.svg`, `i.svg`, `u.svg` |
| 特殊 | 1 | `ü.svg` |
| 带调韵母 | 4 | `ī.svg`, `í.svg`, `ǐ.svg`, `ì.svg` |
| 声调符号 | 4 | `一声调.svg`, `二声调.svg` ... |

所有 SVG 统一 viewBox：`0 0 600 693`

### 音频文件（voice/）

命名规则：`{letter}_voice_teacher.mp3`
当前已有：`z_voice_teacher.mp3`

---

## 注意事项

1. **必须用 HTTP 服务运行**，不可直接打开 HTML 文件
2. 应用默认 1.5s 后从欢迎自动进入教学，如需跳过欢迎可提前设置 `app.className = 'teaching'`
3. 教学状态点击卡片进入画板后不可逆（暂无返回教学状态的功能），需刷新页面重置
4. 暗色模式跟随系统自动切换（`prefers-color-scheme: dark`）
5. iPad 建议使用 Safari，已适配 PWA（`manifest.json`）
