// 字母布局配置：每个字母可以自定义 translateX, translateY, scale
// 如果没有配置，则自动计算
const LETTER_CONFIG = {
  "b": { "tx": 184.49, "ty": 27.15, "scale": 0.5363 },
  "c": { "tx": 145.36, "ty": 16.38, "scale": 0.6701 },
  "ch": { "tx": 32.54, "ty": 24.61, "scale": 0.6514 },
  "d": { "tx": 130.50, "ty": 24.49, "scale": 0.6511 },
  "e": { "tx": 150.83, "ty": 16.60, "scale": 0.6697 },
  "g": { "tx": 171.48, "ty": 16.30, "scale": 0.5695 },
  "h": { "tx": 152.24, "ty": 23.01, "scale": 0.6583 },
  "i": { "tx": 149.23, "ty": 20.90, "scale": 0.6609 },
  "j": { "tx": 121.83, "ty": 1.35, "scale": 0.7398 },
  "k": { "tx": 158.30, "ty": 23.69, "scale": 0.6548 },
  "l": { "tx": 138.20, "ty": -8.07, "scale": 0.7121 },
  "m": { "tx": 134.99, "ty": 13.96, "scale": 0.6786 },
  "n": { "tx": 145.71, "ty": 13.89, "scale": 0.6788 },
  "o": { "tx": 147.55, "ty": 16.24, "scale": 0.6701 },
  "p": { "tx": 183.64, "ty": 27.27, "scale": 0.5393 },
  "q": { "tx": 128.67, "ty": 26.38, "scale": 0.6466 },
  "r": { "tx": 128.36, "ty": 13.39, "scale": 0.6806 },
  "s": { "tx": 147.21, "ty": 16.37, "scale": 0.6699 },
  "sh": { "tx": 26.25, "ty": 26.97, "scale": 0.6505 },
  "t": { "tx": 138.61, "ty": -10.78, "scale": 0.7144 },
  "u": { "tx": 141.86, "ty": 16.06, "scale": 0.6709 },
  "ü": { "tx": 142.23, "ty": 23.08, "scale": 0.6552 },
  "w": { "tx": 147.40, "ty": 16.14, "scale": 0.6704 },
  "x": { "tx": 144.69, "ty": 12.50, "scale": 0.6812 },
  "y": { "tx": 117.51, "ty": -5.06, "scale": 0.7567 },
  "z": { "tx": 143.20, "ty": 8.93, "scale": 0.6889 },
  "zh": { "tx": 22.12, "ty": 17.88, "scale": 0.6688 },
  "ɑ": { "tx": 162.76, "ty": 16.69, "scale": 0.5587 },
  "ī": { "tx": 157.36, "ty": 22.09, "scale": 0.6575 },
  "í": { "tx": 157.36, "ty": 22.09, "scale": 0.6575 },
  "ǐ": { "tx": 157.36, "ty": 22.09, "scale": 0.6575 },
  "ì": { "tx": 157.36, "ty": 22.09, "scale": 0.6575 }
};

class PinyinGrid extends HTMLElement {
  static get observedAttributes() { return ['letter', 'line-color', 'letter-color']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() { this._render(); }
  attributeChangedCallback() { this._render(); }

  async _render() {
    const letter = this.getAttribute('letter');
    if (!letter) return;

    // 可自定义线条颜色和字母颜色
    const lineColor = this.getAttribute('line-color') || '#4A90D9';
    const letterColor = this.getAttribute('letter-color') || '#1a1a1a';

    const svgText = await this._loadSVG(letter);
    if (!svgText) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');
    const srcSvg = doc.querySelector('svg');
    if (!srcSvg) return;

    const paths = [...srcSvg.querySelectorAll('path')].map(p => ({
      d: p.getAttribute('d'),
      fillRule: p.getAttribute('fill-rule') || 'nonzero'
    }));

    const S = 600;
    const ZONE = S / 3;
    const sw = 4.8;

    // 检查是否有自定义配置
    const config = LETTER_CONFIG[letter];
    let tx, ty, scale;

    if (config) {
      tx = config.tx;
      ty = config.ty;
      scale = config.scale;
    } else {
      // 自动计算
      const bbox = this._getBBox(paths);
      if (!bbox) return;

      const ORIG_MID_TOP = 278;
      const ORIG_MID_BOT = 567;
      const hasAscender = bbox.y < ORIG_MID_TOP - 30;
      const hasDescender = (bbox.y + bbox.height) > ORIG_MID_BOT + 30;

      let targetY, targetH;
      if (hasAscender && hasDescender) {
        targetY = 0; targetH = S;
      } else if (hasAscender) {
        targetY = 0; targetH = ZONE * 2;
      } else if (hasDescender) {
        targetY = ZONE; targetH = ZONE * 2;
      } else {
        targetY = ZONE; targetH = ZONE;
      }

      const scaleH = targetH / bbox.height;
      const scaleW = (S * 0.92) / bbox.width;
      scale = Math.min(scaleH, scaleW);

      const scaledW = bbox.width * scale;
      const scaledH = bbox.height * scale;
      tx = (S - scaledW) / 2 - bbox.x * scale;
      ty = targetY + (targetH - scaledH) / 2 - bbox.y * scale;
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; width: 100%; height: 100%; }
        svg { width: 100%; height: 100%; }
      </style>
      <svg viewBox="0 0 ${S} ${S}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="${S}" height="${S}" fill="none" stroke="${lineColor}" stroke-width="${sw}" stroke-dasharray="${sw * 4},${sw * 3}"/>
        <line x1="0" y1="${ZONE}" x2="${S}" y2="${ZONE}" stroke="${lineColor}" stroke-width="${sw}" stroke-dasharray="${sw * 4},${sw * 3}"/>
        <line x1="0" y1="${ZONE * 2}" x2="${S}" y2="${ZONE * 2}" stroke="${lineColor}" stroke-width="${sw}" stroke-dasharray="${sw * 4},${sw * 3}"/>
        <g transform="translate(${tx.toFixed(2)}, ${ty.toFixed(2)}) scale(${scale.toFixed(6)})">
          ${paths.map(p => `<path d="${p.d}" fill="${letterColor}" fill-rule="${p.fillRule}"/>`).join('')}
        </g>
      </svg>
    `;
  }

  _getBBox(paths) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;';
    document.body.appendChild(svg);

    const g = document.createElementNS(ns, 'g');
    for (const p of paths) {
      const el = document.createElementNS(ns, 'path');
      el.setAttribute('d', p.d);
      g.appendChild(el);
    }
    svg.appendChild(g);

    const box = g.getBBox();
    document.body.removeChild(svg);
    return { x: box.x, y: box.y, width: box.width, height: box.height };
  }

  async _loadSVG(letter) {
    const base = this.getAttribute('base-path') || 'svg_output';
    try {
      const resp = await fetch(`${base}/${letter}.svg`);
      if (!resp.ok) return null;
      return resp.text();
    } catch { return null; }
  }
}

customElements.define('pinyin-grid', PinyinGrid);