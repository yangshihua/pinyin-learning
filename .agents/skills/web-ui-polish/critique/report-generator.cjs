#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function generateReport(critiqueData, options = {}) {
  const format = options.format || 'json';
  const output = options.output || null;

  let content;
  switch (format) {
    case 'html':
      content = generateHTMLReport(critiqueData);
      break;
    case 'markdown':
      content = generateMarkdownReport(critiqueData);
      break;
    case 'json':
      content = JSON.stringify(critiqueData, null, 2);
      break;
    default:
      throw new Error(`Unknown format: ${format}. Use html, markdown, or json.`);
  }

  if (output) {
    const dir = path.dirname(output);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(output, content, 'utf8');
  }

  return content;
}

function generateHTMLReport(data) {
  const isBatch = Array.isArray(data.files);
  const scores = isBatch
    ? { overall: data.summary.average_score }
    : data.scores;
  const grade = data.grade || computeGrade(scores.overall);
  const tier = data.tier || computeTier(scores.overall);
  const timestamp = data.timestamp || new Date().toISOString();
  const fileName = isBatch ? `Batch: ${data.directory}` : (data.file_name || data.file || 'Unknown');

  const singleFile = isBatch ? null : data;
  const files = isBatch ? data.files : [data];

  const breakdownHTML = buildBreakdownHTML(singleFile || files[0]);
  const issuesHTML = buildIssuesHTML(files);
  const recommendationsHTML = buildRecommendationsHTML(files);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AetherPane Design Critique — ${fileName}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #f4f2ec;
    --surface: rgba(255, 255, 255, 0.78);
    --surface-solid: #fff;
    --text: #1d1b19;
    --text-muted: #62584f;
    --accent: #295f58;
    --accent-soft: #8ab3a7;
    --line: rgba(81, 60, 30, 0.12);
    --radius: 18px;
    --radius-lg: 24px;
    --font: "Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    --green: #2d8f5e;
    --yellow: #b8860b;
    --red: #c0392b;
    --blue: #2471a3;
  }

  body {
    font-family: var(--font);
    background: var(--bg);
    color: var(--text);
    line-height: 1.72;
    font-size: 1rem;
    padding: 40px 24px;
    min-height: 100vh;
  }

  .container {
    max-width: 820px;
    margin: 0 auto;
  }

  header {
    text-align: center;
    margin-bottom: 48px;
  }

  .logo {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--accent);
    margin-bottom: 16px;
  }

  h1 {
    font-size: clamp(1.8rem, 4vw, 2.6rem);
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.15;
    margin-bottom: 12px;
  }

  .subtitle {
    color: var(--text-muted);
    font-size: 1.04rem;
    max-width: 52ch;
    margin: 0 auto;
  }

  .hero-score {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 32px;
    background: var(--surface);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: var(--radius-lg);
    padding: 40px;
    margin-bottom: 36px;
  }

  .score-circle {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 3px solid var(--accent);
    background: var(--surface-solid);
  }

  .score-value {
    font-size: 2.2rem;
    font-weight: 800;
    line-height: 1;
  }

  .score-max {
    font-size: 0.72rem;
    color: var(--text-muted);
    margin-top: 2px;
  }

  .score-meta {
    text-align: left;
  }

  .grade {
    font-size: 2rem;
    font-weight: 800;
    color: var(--accent);
    line-height: 1;
    margin-bottom: 4px;
  }

  .tier {
    font-size: 0.82rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
  }

  .file-name {
    font-size: 0.88rem;
    color: var(--text-muted);
    margin-top: 8px;
    word-break: break-all;
  }

  .section {
    margin-bottom: 36px;
  }

  .section-title {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--accent);
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--line);
  }

  .dimension {
    background: var(--surface-solid);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: 20px 24px;
    margin-bottom: 12px;
  }

  .dimension-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .dimension-name {
    font-weight: 600;
    font-size: 0.95rem;
  }

  .dimension-score {
    font-weight: 700;
    font-size: 0.95rem;
  }

  .progress-track {
    height: 8px;
    background: var(--line);
    border-radius: 999px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 0.4s ease;
  }

  .issue {
    background: var(--surface-solid);
    border: 1px solid var(--line);
    border-left: 4px solid var(--line);
    border-radius: 0 var(--radius) var(--radius) 0;
    padding: 16px 20px;
    margin-bottom: 10px;
  }

  .issue.error { border-left-color: var(--red); }
  .issue.warning { border-left-color: var(--yellow); }
  .issue.info { border-left-color: var(--blue); }

  .issue-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }

  .severity-badge {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 2px 8px;
    border-radius: 999px;
    font-weight: 700;
    color: #fff;
  }

  .severity-badge.error { background: var(--red); }
  .severity-badge.warning { background: var(--yellow); }
  .severity-badge.info { background: var(--blue); }

  .issue-location {
    font-size: 0.82rem;
    font-weight: 600;
  }

  .issue-problem {
    font-size: 0.9rem;
    margin-bottom: 4px;
  }

  .issue-suggestion {
    font-size: 0.82rem;
    color: var(--text-muted);
  }

  .issue-fix {
    background: rgba(0,0,0,0.04);
    border-radius: 8px;
    padding: 10px 14px;
    margin-top: 8px;
    font-family: "SF Mono", "Fira Code", monospace;
    font-size: 0.78rem;
    white-space: pre-wrap;
    line-height: 1.5;
    color: var(--accent);
  }

  .rec-item {
    padding: 12px 16px;
    margin-bottom: 8px;
    background: var(--surface-solid);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    font-size: 0.92rem;
  }

  .rec-number {
    font-weight: 700;
    color: var(--accent);
    margin-right: 6px;
  }

  .footer {
    text-align: center;
    color: var(--text-muted);
    font-size: 0.75rem;
    margin-top: 48px;
    padding-top: 24px;
    border-top: 1px solid var(--line);
  }

  @media (max-width: 720px) {
    body { padding: 24px 16px; }
    .hero-score { flex-direction: column; gap: 20px; padding: 28px; }
    .score-meta { text-align: center; }
  }
</style>
</head>
<body>
<div class="container">
  <header>
    <p class="logo">AetherPane Design Critique</p>
    <h1>Design Quality Report</h1>
    <p class="subtitle">Automated analysis of visual hierarchy, spacing, glass usage, and typography.</p>
  </header>

  <div class="hero-score">
    <div class="score-circle">
      <span class="score-value">${scores.overall}</span>
      <span class="score-max">/10</span>
    </div>
    <div class="score-meta">
      <div class="grade">Grade: ${grade}</div>
      <div class="tier">${tier.replace('-', ' ')}</div>
      <div class="file-name">${fileName}</div>
    </div>
  </div>

  <section class="section">
    <h2 class="section-title">Dimension Breakdown</h2>
    ${breakdownHTML}
  </section>

  <section class="section">
    <h2 class="section-title">Issues</h2>
    ${issuesHTML}
  </section>

  <section class="section">
    <h2 class="section-title">Recommendations</h2>
    ${recommendationsHTML}
  </section>

  <footer class="footer">
    Generated by AetherPane Critique Engine &middot; ${timestamp}
  </footer>
</div>
</body>
</html>`;
}

function buildBreakdownHTML(data) {
  if (!data || !data.scores) return '<p>No score data available.</p>';

  const dims = [
    { key: 'visual_hierarchy', label: 'Visual Hierarchy' },
    { key: 'breathing_space', label: 'Breathing Space' },
    { key: 'glass_quality', label: 'Glass Quality' },
    { key: 'typography', label: 'Typography' }
  ];

  return dims.map(d => {
    const s = data.scores[d.key];
    const pct = (s / 10) * 100;
    const color = s >= 8 ? 'var(--green)' : s >= 6 ? 'var(--yellow)' : 'var(--red)';
    return `<div class="dimension">
      <div class="dimension-header">
        <span class="dimension-name">${d.label}</span>
        <span class="dimension-score" style="color:${color}">${s}/10</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width:${pct}%;background:${color}"></div>
      </div>
    </div>`;
  }).join('\n');
}

function buildIssuesHTML(files) {
  const allIssues = [];
  (Array.isArray(files) ? files : [files]).forEach(f => {
    if (f.dimensions) {
      Object.entries(f.dimensions).forEach(([dim, data]) => {
        (data.issues || []).forEach(i => {
          allIssues.push({ ...i, dimension: dim, file: f.file_name });
        });
      });
    }
  });

  if (allIssues.length === 0) {
    return '<p style="color:var(--text-muted)">No issues detected. Well done.</p>';
  }

  const order = { error: 0, warning: 1, info: 2 };
  allIssues.sort((a, b) => (order[a.severity] || 3) - (order[b.severity] || 3));

  return allIssues.map(i => `<div class="issue ${i.severity}">
    <div class="issue-header">
      <span class="severity-badge ${i.severity}">${i.severity}</span>
      <span class="issue-location">${i.location}</span>
    </div>
    <p class="issue-problem">${i.problem}</p>
    <p class="issue-suggestion">→ ${i.suggestion}</p>
    ${i.code_fix ? `<div class="issue-fix">${escapeHTML(i.code_fix)}</div>` : ''}
  </div>`).join('\n');
}

function buildRecommendationsHTML(files) {
  const recs = [];
  (Array.isArray(files) ? files : [files]).forEach(f => {
    (f.recommendations || []).forEach(r => recs.push(r));
  });

  const unique = [...new Set(recs)];

  if (unique.length === 0) {
    return '<p style="color:var(--text-muted)">No specific recommendations.</p>';
  }

  return unique.map((r, i) => `<div class="rec-item">
    <span class="rec-number">${i + 1}.</span>${escapeHTML(r)}
  </div>`).join('\n');
}

function generateMarkdownReport(data) {
  const isBatch = Array.isArray(data.files);
  const scores = isBatch ? { overall: data.summary.average_score } : data.scores;
  const grade = data.grade || computeGrade(scores.overall);
  const tier = data.tier || computeTier(scores.overall);
  const timestamp = data.timestamp || new Date().toISOString();
  const fileName = isBatch ? `Batch: ${data.directory}` : (data.file_name || data.file || 'Unknown');
  const files = isBatch ? data.files : [data];

  let md = `# AetherPane Design Critique\n\n`;
  md += `**File:** ${fileName}  \n`;
  md += `**Overall Score:** ${scores.overall}/10  \n`;
  md += `**Grade:** ${grade}  \n`;
  md += `**Tier:** ${tier}  \n`;
  md += `**Date:** ${timestamp}\n\n`;

  md += `## Dimension Scores\n\n`;
  md += `| Dimension | Score | Bar |\n`;
  md += `|-----------|-------|-----|\n`;

  const dimLabels = {
    visual_hierarchy: 'Visual Hierarchy',
    breathing_space: 'Breathing Space',
    glass_quality: 'Glass Quality',
    typography: 'Typography'
  };

  files.forEach(f => {
    if (!f.scores) return;
    Object.entries(dimLabels).forEach(([key, label]) => {
      const s = f.scores[key];
      if (s === undefined) return;
      const filled = '█'.repeat(Math.round(s));
      const empty = '░'.repeat(10 - Math.round(s));
      md += `| ${label} | ${s}/10 | ${filled}${empty} |\n`;
    });
  });

  md += `\n## Issues\n\n`;
  const allIssues = [];
  files.forEach(f => {
    if (f.dimensions) {
      Object.entries(f.dimensions).forEach(([dim, data]) => {
        (data.issues || []).forEach(i => {
          allIssues.push({ ...i, dimension: dim });
        });
      });
    }
  });

  if (allIssues.length === 0) {
    md += `No issues detected.\n`;
  } else {
    const order = { error: 0, warning: 1, info: 2 };
    allIssues.sort((a, b) => (order[a.severity] || 3) - (order[b.severity] || 3));
    allIssues.forEach(i => {
      const icon = i.severity === 'error' ? '✖' : i.severity === 'warning' ? '⚠' : 'ℹ';
      md += `- ${icon} **[${i.severity.toUpperCase()}]** \`${i.location}\` — ${i.problem}\n`;
      md += `  - → ${i.suggestion}\n`;
      if (i.code_fix) {
        md += `  - Fix: \`${i.code_fix.replace(/\n/g, ' ')}\`\n`;
      }
    });
  }

  md += `\n## Recommendations\n\n`;
  const recs = [];
  files.forEach(f => (f.recommendations || []).forEach(r => recs.push(r)));
  const unique = [...new Set(recs)];
  if (unique.length === 0) {
    md += `No specific recommendations.\n`;
  } else {
    unique.forEach((r, i) => { md += `${i + 1}. ${r}\n`; });
  }

  md += `\n---\n*Generated by AetherPane Critique Engine*\n`;
  return md;
}

function computeGrade(overall) {
  if (overall >= 9.5) return 'A+';
  if (overall >= 9.0) return 'A';
  if (overall >= 8.5) return 'B+';
  if (overall >= 7.5) return 'B';
  if (overall >= 6.5) return 'C+';
  if (overall >= 6.0) return 'C';
  if (overall >= 5.0) return 'D';
  return 'F';
}

function computeTier(overall) {
  if (overall >= 9.0) return 'exceptional';
  if (overall >= 7.5) return 'production-ready';
  if (overall >= 6.0) return 'acceptable';
  if (overall >= 4.0) return 'below-standard';
  return 'unusable';
}

function escapeHTML(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const inputPath = args[0];
  const format = args.includes('--format') ? args[args.indexOf('--format') + 1] : 'markdown';
  const outputIdx = args.indexOf('--output');
  const outputPath = outputIdx !== -1 ? args[outputIdx + 1] : null;

  if (!inputPath) {
    console.error('Usage: node report-generator.cjs <critique.json> [--format html|markdown|json] [--output report.html]');
    process.exit(1);
  }

  const critiqueData = JSON.parse(require('fs').readFileSync(inputPath, 'utf8'));
  const result = generateReport(critiqueData, { format, output: outputPath });

  if (!outputPath) {
    console.log(result);
  } else {
    console.log(`Report written to ${outputPath}`);
  }
}

module.exports = { generateReport };
