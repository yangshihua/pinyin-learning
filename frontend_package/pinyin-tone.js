// 声调布局配置：一声、二声、三声、四声的位置和缩放
// 放在拼音格的上格区域
const TONE_CONFIG = {
  "一声调": { tx: 99.0, ty: 34.0, scale: 0.8 },
  "二声调": { tx: 99.0, ty: 34.0, scale: 0.8 },
  "三声调": { tx: 99.0, ty: 34.0, scale: 0.8 },
  "四声调": { tx: 99.0, ty: 34.0, scale: 0.8 }
};

class PinyinTone extends HTMLElement {
  static get observedAttributes() { return ['tone']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() { this._render(); }
  attributeChangedCallback() { this._render(); }

  async _render() {
    const tone = this.getAttribute('tone');
    if (!tone) return;

    const svgText = await this._loadSVG(tone);
    if (!svgText) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');
    const srcSvg = doc.querySelector('svg');
    if (!srcSvg) return;

    const paths = [...srcSvg.querySelectorAll('path')].map(p => ({
      d: p.getAttribute('d'),
      fillRule: p.getAttribute('fill-rule') || 'nonzero'
    }));

    // 上格区域：y从0到200 (ZONE = 600/3)
    // 使用配置或默认值
    const config = TONE_CONFIG[tone];
    const tx = config ? config.tx : 200;
    const ty = config ? config.ty : 50;
    const scale = config ? config.scale : 0.3;

    const S = 600;
    const ZONE = S / 3;
    const sw = 4.8;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; width: 100%; height: 100%; }
        svg { width: 100%; height: 100%; }
      </style>
      <svg viewBox="0 0 ${S} ${ZONE}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(${tx.toFixed(2)}, ${ty.toFixed(2)}) scale(${scale.toFixed(6)})">
          ${paths.map(p => `<path d="${p.d}" fill="#1a1a1a" fill-rule="${p.fillRule}"/>`).join('')}
        </g>
      </svg>
    `;
  }

  async _loadSVG(tone) {
    const base = this.getAttribute('base-path') || 'svg_output';
    try {
      const resp = await fetch(`${base}/${tone}.svg`);
      if (!resp.ok) return null;
      return resp.text();
    } catch { return null; }
  }
}

customElements.define('pinyin-tone', PinyinTone);