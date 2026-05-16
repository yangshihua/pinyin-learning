#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function visualizeIssues(inputHtmlPath, critiqueData, outputPath) {
  const html = fs.readFileSync(inputHtmlPath, 'utf8');

  const allIssues = [];
  if (critiqueData.dimensions) {
    Object.entries(critiqueData.dimensions).forEach(([dim, data]) => {
      (data.issues || []).forEach(issue => {
        allIssues.push({ ...issue, dimension: dim });
      });
    });
  }

  const injectedCSS = `
<style data-aetherpane-critique>
  [data-critique-error] {
    outline: 3px solid #c0392b !important;
    outline-offset: 2px;
    position: relative;
  }
  [data-critique-warning] {
    outline: 3px solid #b8860b !important;
    outline-offset: 2px;
    position: relative;
  }
  [data-critique-info] {
    outline: 3px solid #2471a3 !important;
    outline-offset: 2px;
    position: relative;
  }
  [data-critique-error]:hover::after,
  [data-critique-warning]:hover::after,
  [data-critique-info]:hover::after {
    content: attr(data-critique-tooltip);
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    z-index: 999999;
    background: rgba(29, 27, 25, 0.95);
    color: #fff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 13px;
    line-height: 1.5;
    padding: 12px 16px;
    border-radius: 12px;
    max-width: 380px;
    white-space: pre-line;
    pointer-events: none;
    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  }
  [data-critique-error]:hover::before,
  [data-critique-warning]:hover::before,
  [data-critique-info]:hover::before {
    content: attr(data-critique-severity);
    position: absolute;
    top: -28px;
    left: 0;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 3px 10px;
    border-radius: 999px;
    color: #fff;
    pointer-events: none;
  }
  [data-critique-error]::before { background: #c0392b; }
  [data-critique-warning]::before { background: #b8860b; }
  [data-critique-info]::before { background: #2471a3; }

  .aetherpane-critique-badge {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 999999;
    background: rgba(29, 27, 25, 0.9);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    color: #fff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 13px;
    padding: 12px 20px;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    display: flex;
    gap: 16px;
    align-items: center;
  }
  .aetherpane-critique-badge .score {
    font-weight: 800;
    font-size: 18px;
  }
  .aetherpane-critique-badge .grade {
    font-weight: 700;
    color: #8ab3a7;
  }
</style>
`;

  const injectedJS = `
<script data-aetherpane-critique>
(function() {
  var badge = document.createElement('div');
  badge.className = 'aetherpane-critique-badge';
  badge.innerHTML =
    '<span class="score">${critiqueData.scores ? critiqueData.scores.overall : '?'}/10</span>' +
    '<span class="grade">${critiqueData.grade || ''}</span>' +
    '<span>${allIssues.length} issue(s)</span>';
  document.body.appendChild(badge);

  document.addEventListener('mouseover', function(e) {
    var el = e.target.closest('[data-critique-error], [data-critique-warning], [data-critique-info]');
    if (el) el.style.zIndex = '999998';
  });
  document.addEventListener('mouseout', function(e) {
    var el = e.target.closest('[data-critique-error], [data-critique-warning], [data-critique-info]');
    if (el) el.style.zIndex = '';
  });
})();
</script>
`;

  let annotated = html;

  const selectorMap = buildSelectorMap(allIssues);
  for (const [selector, issues] of Object.entries(selectorMap)) {
    const severities = issues.map(i => i.severity);
    const worst = severities.includes('error') ? 'error' : severities.includes('warning') ? 'warning' : 'info';

    const tooltipParts = issues.map(i => {
      let t = `[${i.severity.toUpperCase()}] ${i.problem}\\n→ ${i.suggestion}`;
      return t;
    });
    const tooltip = tooltipParts.join('\\n---\\n');

    annotated = annotateElement(annotated, selector, worst, tooltip);
  }

  const missingStructures = detectMissingStructures(allIssues, html);
  missingStructures.forEach(({ marker, severity, tooltip }) => {
    annotated = insertMarkerAnnotation(annotated, marker, severity, tooltip);
  });

  if (annotated.includes('</head>')) {
    annotated = annotated.replace('</head>', injectedCSS + '</head>');
  } else {
    annotated = injectedCSS + annotated;
  }

  if (annotated.includes('</body>')) {
    annotated = annotated.replace('</body>', injectedJS + '</body>');
  } else {
    annotated = annotated + injectedJS;
  }

  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outputPath, annotated, 'utf8');

  return { outputPath, issuesAnnotated: allIssues.length };
}

function buildSelectorMap(issues) {
  const map = {};
  issues.forEach(issue => {
    const sel = issueToSelector(issue);
    if (sel) {
      if (!map[sel]) map[sel] = [];
      map[sel].push(issue);
    }
  });
  return map;
}

function issueToSelector(issue) {
  const loc = issue.location.toLowerCase();
  if (loc.includes('h1')) return 'h1';
  if (loc.includes('h2')) return 'h2';
  if (loc.includes('section')) return 'section';
  if (loc.includes('topbar')) return '.topbar';
  if (loc.includes('hero-panel')) return '.hero-panel';
  if (loc.includes('dashboard-nav')) return '.dashboard-nav';
  if (loc.includes('modal')) return '.modal-shell';
  if (loc.includes('button') || loc.includes('cta')) return '.button.primary, button.primary';
  if (loc.includes('card-title')) return '.card-title';
  if (loc.includes('mini-label')) return '.mini-label';
  if (loc.includes('eyebrow')) return '.eyebrow';
  if (loc.includes('lede')) return '.lede';
  if (loc.includes('glass')) return '.glass';
  return null;
}

function annotateElement(html, selector, severity, tooltip) {
  const escapedTooltip = tooltip.replace(/"/g, '&quot;');

  if (selector.startsWith('.')) {
    const className = selector.substring(1).split(',')[0].trim();
    const regex = new RegExp(`(class=")([^"]*${escapeRegex(className)}[^"]*)(")`, 'i');
    const match = html.match(regex);
    if (match) {
      const attr = `data-critique-${severity}`;
      const tooltipAttr = `data-critique-tooltip="${escapedTooltip}"`;
      const severityAttr = `data-critique-severity="${severity.toUpperCase()}"`;
      const tagMatch = html.match(new RegExp(`<([^>]+class="[^"]*${escapeRegex(className)}[^"]*"[^>]*)`, 'i'));
      if (tagMatch && !tagMatch[1].includes('data-critique-')) {
        return html.replace(tagMatch[1], tagMatch[1] + ` ${attr} ${tooltipAttr} ${severityAttr}`);
      }
    }
    return html;
  }

  const tagMatch = html.match(new RegExp(`<${escapeRegex(selector)}(\\s[^>]*)?>`, 'i'));
  if (tagMatch && !tagMatch[0].includes('data-critique-')) {
    const attr = `data-critique-${severity}`;
    const tooltipAttr = `data-critique-tooltip="${escapedTooltip}"`;
    const severityAttr = `data-critique-severity="${severity.toUpperCase()}"`;
    if (tagMatch[1]) {
      return html.replace(tagMatch[0], `<${selector} ${attr} ${tooltipAttr} ${severityAttr}${tagMatch[1]}>`);
    }
    return html.replace(tagMatch[0], `<${selector} ${attr} ${tooltipAttr} ${severityAttr}>`);
  }

  return html;
}

function detectMissingStructures(issues, html) {
  const markers = [];
  issues.forEach(issue => {
    const loc = issue.location.toLowerCase();
    if (loc.includes('page root') && issue.problem.toLowerCase().includes('missing h1')) {
      markers.push({
        marker: '<body>',
        severity: 'error',
        tooltip: `[ERROR] Missing h1 element\\n→ ${issue.suggestion}`
      });
    }
    if (loc.includes('page structure') && issue.problem.includes('section')) {
      markers.push({
        marker: '<body>',
        severity: 'warning',
        tooltip: `[WARNING] ${issue.problem}\\n→ ${issue.suggestion}`
      });
    }
    if (loc.includes('page surfaces') && issue.problem.toLowerCase().includes('no glass')) {
      markers.push({
        marker: '</head>',
        severity: 'info',
        tooltip: `[INFO] ${issue.problem}\\n→ ${issue.suggestion}`
      });
    }
  });
  return markers;
}

function insertMarkerAnnotation(html, marker, severity, tooltip) {
  const escapedTooltip = tooltip.replace(/"/g, '&quot;');
  const comment = `<!-- AetherPane Critique: ${severity.toUpperCase()} — hover to see details -->`;

  if (marker === '<body>') {
    const bodyMatch = html.match(/<body[^>]*>/i);
    if (bodyMatch) {
      return html.replace(bodyMatch[0], bodyMatch[0] + `\n${comment}\n<div data-critique-${severity} data-critique-tooltip="${escapedTooltip}" data-critique-severity="${severity.toUpperCase()}" style="padding:8px 16px;margin:4px 0;display:inline-block;">⚠ Critique marker (hover for details)</div>`);
    }
  }

  return html;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const htmlPath = args[0];
  const jsonPath = args[1];
  const outputPath = args[2] || 'critique-annotated.html';

  if (!htmlPath || !jsonPath) {
    console.error('Usage: node visualizer.cjs <input.html> <critique.json> [output.html]');
    process.exit(1);
  }

  const critiqueData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const result = visualizeIssues(htmlPath, critiqueData, outputPath);
  console.log(`Annotated ${result.issuesAnnotated} issues → ${result.outputPath}`);
}

module.exports = { visualizeIssues };
