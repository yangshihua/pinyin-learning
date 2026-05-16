#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function critiqueFile(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const vhr = scoreVisualHierarchy(html);
  const bsr = scoreBreathingSpace(html);
  const gqr = scoreGlassQuality(html);
  const tyr = scoreTypography(html);

  const overall = parseFloat(
    (vhr.score * 0.30 + bsr.score * 0.25 + gqr.score * 0.20 + tyr.score * 0.25).toFixed(1)
  );

  const report = {
    file: filePath,
    file_name: path.basename(filePath),
    timestamp: new Date().toISOString(),
    scores: {
      visual_hierarchy: vhr.score,
      breathing_space: bsr.score,
      glass_quality: gqr.score,
      typography: tyr.score,
      overall: overall
    },
    grade: computeGrade(overall),
    tier: computeTier(overall),
    dimensions: {
      visual_hierarchy: {
        score: vhr.score,
        issues: vhr.issues
      },
      breathing_space: {
        score: bsr.score,
        issues: bsr.issues
      },
      glass_quality: {
        score: gqr.score,
        issues: gqr.issues
      },
      typography: {
        score: tyr.score,
        issues: tyr.issues
      }
    },
    details: {
      ...vhr.details,
      ...bsr.details,
      ...gqr.details,
      ...tyr.details
    },
    recommendations: buildRecommendations(vhr, bsr, gqr, tyr, overall)
  };

  return report;
}

function critiqueDirectory(dirPath, options = {}) {
  const entries = fs.readdirSync(dirPath);
  const htmlFiles = entries.filter(f => f.endsWith('.html'));

  if (htmlFiles.length === 0) {
    return { directory: dirPath, files: [], summary: 'No HTML files found' };
  }

  const results = htmlFiles.map(f => critiqueFile(path.join(dirPath, f)));

  const summary = {
    total_files: results.length,
    average_score: parseFloat(
      (results.reduce((s, r) => s + r.scores.overall, 0) / results.length).toFixed(1)
    ),
    best: results.reduce((a, b) => (a.scores.overall >= b.scores.overall ? a : b)).file_name,
    worst: results.reduce((a, b) => (a.scores.overall <= b.scores.overall ? a : b)).file_name,
    by_tier: {}
  };

  results.forEach(r => {
    if (!summary.by_tier[r.tier]) summary.by_tier[r.tier] = 0;
    summary.by_tier[r.tier]++;
  });

  const report = { directory: dirPath, files: results, summary };

  if (options.compare) {
    report.comparison = compareWithPrevious(results, options.compare);
  }

  return report;
}

function compareWithPrevious(currentResults, previousPath) {
  let previous;
  try {
    const raw = fs.readFileSync(previousPath, 'utf8');
    previous = JSON.parse(raw);
  } catch {
    return { error: `Could not read previous scores from ${previousPath}` };
  }

  const prevMap = {};
  const prevFiles = Array.isArray(previous) ? previous : (previous.files || []);
  prevFiles.forEach(r => { prevMap[r.file_name || r.file] = r.scores; });

  return currentResults.map(curr => {
    const prev = prevMap[curr.file_name];
    if (!prev) return { file: curr.file_name, status: 'new' };
    return {
      file: curr.file_name,
      status: 'compared',
      overall_delta: parseFloat((curr.scores.overall - prev.overall).toFixed(1)),
      dimensions: {
        visual_hierarchy: parseFloat((curr.scores.visual_hierarchy - prev.visual_hierarchy).toFixed(1)),
        breathing_space: parseFloat((curr.scores.breathing_space - prev.breathing_space).toFixed(1)),
        glass_quality: parseFloat((curr.scores.glass_quality - prev.glass_quality).toFixed(1)),
        typography: parseFloat((curr.scores.typography - prev.typography).toFixed(1))
      }
    };
  });
}

function scoreVisualHierarchy(html) {
  let score = 5;
  const issues = [];
  const details = {};
  const suggestions = [];

  const h1Matches = html.match(/<h1[\s>]/g) || [];
  const h1Count = h1Matches.length;
  const h2Matches = html.match(/<h2[\s>]/g) || [];
  const h2Count = h2Matches.length;
  const h3Matches = html.match(/<h3[\s>]/g) || [];
  const h3Count = h3Matches.length;

  details.h1Count = h1Count;
  details.h2Count = h2Count;
  details.h3Count = h3Count;

  if (h1Count === 1) {
    score += 1.5;
    details.headingContrast = 'strong';
  } else if (h1Count === 0) {
    details.headingContrast = 'weak';
    issues.push({
      severity: 'error',
      location: 'page root',
      problem: 'Missing h1 element',
      suggestion: 'Add exactly one h1 as the page title',
      code_fix: '<h1>Page Title</h1>'
    });
  } else {
    details.headingContrast = 'multiple';
    score += 0.5;
    issues.push({
      severity: 'warning',
      location: 'h1 elements',
      problem: `Found ${h1Count} h1 elements; should be exactly 1`,
      suggestion: 'Keep only one h1 per page; demote extras to h2',
      code_fix: 'Replace extra <h1>...</h1> with <h2>...</h2>'
    });
  }

  if (h2Count >= 1) {
    score += 1;
  } else {
    issues.push({
      severity: 'warning',
      location: 'page sections',
      problem: 'No h2 elements found',
      suggestion: 'Add h2 headings to label each section',
      code_fix: '<h2>Section Title</h2>'
    });
  }

  const hasEyebrow = /class="[^"]*eyebrow[^"]*"/.test(html) || html.includes('class="eyebrow"');
  if (hasEyebrow) {
    score += 0.5;
  } else {
    issues.push({
      severity: 'info',
      location: 'hero section',
      problem: 'No .eyebrow label used',
      suggestion: 'Add an eyebrow paragraph above h1 for section context',
      code_fix: '<p className="eyebrow">Category Label</p>'
    });
  }

  const hasLede = /class="[^"]*lede[^"]*"/.test(html) || html.includes('class="lede"');
  if (hasLede) {
    score += 0.5;
  }

  const primaryButtons = (html.match(/button\s+primary|btn-primary|class="[^"]*button[^"]*primary[^"]*"/g) || []).length;
  details.ctaCount = primaryButtons;
  if (primaryButtons >= 1 && primaryButtons <= 3) {
    score += 1;
  } else if (primaryButtons > 3) {
    score -= 0.5;
    issues.push({
      severity: 'warning',
      location: 'page-wide CTAs',
      problem: `${primaryButtons} primary buttons found; recommended max is 3`,
      suggestion: 'Reduce to 1-3 primary CTAs; use secondary buttons for alternatives',
      code_fix: 'class="button secondary"  (for non-primary actions)'
    });
  } else {
    issues.push({
      severity: 'warning',
      location: 'page-wide CTAs',
      problem: 'No primary CTA buttons found',
      suggestion: 'Add at least one primary action button per page',
      code_fix: '<button className="button primary" type="button">Action</button>'
    });
  }

  const hasSpotlight = html.includes('spotlight');
  if (hasSpotlight) score += 0.5;

  const sectionCount = (html.match(/<section/g) || []).length;
  const mainCount = (html.match(/<main/g) || []).length;
  details.sectionCount = sectionCount + mainCount;

  if (sectionCount + mainCount >= 3) {
    score += 1.5;
  } else if (sectionCount + mainCount >= 2) {
    score += 0.5;
    issues.push({
      severity: 'warning',
      location: 'page structure',
      problem: `Only ${sectionCount + mainCount} section/main elements; target is 3+`,
      suggestion: 'Add sections for hero, content, and CTA at minimum',
      code_fix: '<section className="section cta-band rise">\n  ...\n</section>'
    });
  } else {
    issues.push({
      severity: 'warning',
      location: 'page structure',
      problem: `Only ${sectionCount + mainCount} section/main elements; page needs clear rhythm`,
      suggestion: 'Structure the page with at least 3 sections (hero, content, CTA)',
      code_fix: '<section className="page-hero section">...</section>\n<section className="section">...</section>\n<section className="section cta-band rise">...</section>'
    });
  }

  return { score: clamp(score), details, issues, suggestions };
}

function scoreBreathingSpace(html) {
  let score = 5;
  const issues = [];
  const details = {};
  const suggestions = [];

  const hasSectionClass = html.includes('class="section"') || html.includes("class='section'") ||
    /class="[^"]*section[^"]*"/.test(html);
  if (hasSectionClass) {
    score += 1.5;
    details.sectionSpacing = 'system-class';
  } else {
    details.sectionSpacing = 'missing';
    issues.push({
      severity: 'warning',
      location: 'section elements',
      problem: 'No .section class detected for vertical rhythm',
      suggestion: 'Apply .section class to all page sections for consistent spacing',
      code_fix: '<section className="section">'
    });
  }

  const hasSpaceSection = html.includes('--space-section') || html.includes('space-section');
  if (hasSpaceSection) {
    score += 1;
  }

  const gapClasses = ['card-row', 'stacked-cards', 'metric-row', 'panel-grid', 'gap'];
  const gapCount = gapClasses.filter(cls => html.includes(cls)).length;
  details.gapUsage = gapCount;
  if (gapCount >= 2) {
    score += 1;
  } else if (gapCount === 1) {
    score += 0.5;
    issues.push({
      severity: 'info',
      location: 'layout containers',
      problem: 'Limited use of system gap utilities',
      suggestion: 'Use more gap classes (card-row, stacked-cards, metric-row, panel-grid)',
      code_fix: '<div className="card-row">...</div>'
    });
  } else {
    issues.push({
      severity: 'warning',
      location: 'layout containers',
      problem: 'No system gap utilities detected',
      suggestion: 'Use AetherPane gap classes for element spacing',
      code_fix: '<div className="stacked-cards">...</div>'
    });
  }

  const maxLineLength = html.includes('max-width') && (html.includes('ch') || html.includes('--max-width-text'));
  if (maxLineLength) {
    score += 1;
  } else {
    issues.push({
      severity: 'warning',
      location: 'text blocks',
      problem: 'No max-width constraint on text (measure/line length)',
      suggestion: 'Add max-width: 55-70ch to text containers for readability',
      code_fix: 'max-width: 62ch;  /* or use --max-width-text token */'
    });
  }

  const paddingMatches = html.match(/padding:\s*\d+px/g) || [];
  const largePadding = paddingMatches.filter(p => {
    const m = p.match(/\d+/);
    return m && parseInt(m[0]) >= 60;
  });
  if (largePadding.length > 0) {
    score += 0.5;
    details.largePadding = true;
  } else {
    details.largePadding = false;
  }

  const marginMatches = html.match(/margin-top:\s*\d+px|margin-bottom:\s*\d+px|padding-top:\s*\d+px|padding-bottom:\s*\d+px/g) || [];
  const crampedMargin = marginMatches.filter(m => {
    const val = parseInt(m.match(/\d+/)[0]);
    return val < 20;
  });
  if (crampedMargin.length > 3) {
    issues.push({
      severity: 'warning',
      location: 'spacing values',
      problem: 'Multiple cramped spacing values (< 20px) detected',
      suggestion: 'Increase vertical spacing between sections to at least 60px',
      code_fix: 'padding: 76px 0;  /* use --space-section token */'
    });
  }

  return { score: clamp(score), details, issues, suggestions };
}

function scoreGlassQuality(html) {
  let score = 5;
  const issues = [];
  const details = {};
  const suggestions = [];

  const glassMatches = html.match(/class="[^"]*glass[^"]*"/g) || [];
  const glassCount = glassMatches.length;
  details.glassCount = glassCount;

  const appropriateShells = ['topbar', 'hero-panel', 'dashboard-nav', 'modal-shell', 'drawer-shell', 'theme-dock'];
  const avoidSurfaces = ['story-card', 'principle-card', 'stage-card', 'metric-card', 'content-panel', 'settings-group'];

  const glassOnShells = appropriateShells.filter(shell => {
    return new RegExp(`class="[^"]*(?:${shell})[^"]*glass[^"]*"|class="[^"]*glass[^"]*(?:${shell})[^"]*"`).test(html);
  });
  details.glassOnShells = glassOnShells;

  const glassOnAvoided = avoidSurfaces.filter(surface => {
    return new RegExp(`class="[^"]*(?:${surface})[^"]*glass[^"]*"|class="[^"]*glass[^"]*(?:${surface})[^"]*"`).test(html);
  });
  details.glassOnAvoided = glassOnAvoided;

  const nestedGlassPattern = /class="[^"]*glass[^"]*"[^>]*>[^<]*(?:<[^>]*>)*[^<]*<[^>]*class="[^"]*glass[^"]*"/g;
  const nestedGlass = html.match(nestedGlassPattern) || [];
  details.glassNesting = nestedGlass.length;

  if (glassCount === 0) {
    score = 7;
    details.glassUsage = 'none';
    issues.push({
      severity: 'info',
      location: 'page surfaces',
      problem: 'No glass effects used',
      suggestion: 'Consider adding glass to one premium shell (topbar, hero-panel)',
      code_fix: '<nav className="topbar glass">...</nav>'
    });
  } else if (glassCount <= 2) {
    score = 9;
    details.glassUsage = 'minimal';
  } else if (glassCount <= 4 && glassOnShells.length >= 1) {
    score = 8;
    details.glassUsage = 'appropriate';
  } else if (glassCount <= 6) {
    score = 6;
    details.glassUsage = 'moderate';
    issues.push({
      severity: 'warning',
      location: 'page-wide glass usage',
      problem: `${glassCount} glass surfaces; recommended max is 4`,
      suggestion: 'Reduce glass usage - reserve for top-level shells only',
      code_fix: 'Remove class="glass" from content cards; keep on shells only'
    });
  } else {
    score = 3;
    details.glassUsage = 'excessive';
    issues.push({
      severity: 'error',
      location: 'page-wide glass usage',
      problem: `${glassCount} glass surfaces is excessive; maximum recommended is 4`,
      suggestion: 'Remove glass from content cards and minor surfaces; use only on topbar, hero-panel, modals',
      code_fix: 'Replace class="glass" with solid background on cards:\nstyle="background: var(--surface-card)"'
    });
  }

  if (nestedGlass.length > 0) {
    score -= 2;
    issues.push({
      severity: 'error',
      location: 'nested glass elements',
      problem: `${nestedGlass.length} nested glass element(s) detected`,
      suggestion: 'Keep child elements solid; glass on parents only',
      code_fix: 'Remove class="glass" from inner elements; use solid background'
    });
  }

  if (glassOnAvoided.length > 0) {
    issues.push({
      severity: 'warning',
      location: glassOnAvoided.join(', '),
      problem: `Glass applied to content surfaces that should stay solid (${glassOnAvoided.join(', ')})`,
      suggestion: 'Remove glass from content cards/panels; these should use solid backgrounds',
      code_fix: 'Replace glass with solid card style: background: var(--surface-card)'
    });
  }

  return { score: clamp(score), details, issues, suggestions };
}

function scoreTypography(html) {
  let score = 5;
  const issues = [];
  const details = {};
  const suggestions = [];

  const hasFontBody = html.includes('--font-body') || html.includes('font-body');
  const hasFontDisplay = html.includes('--font-display') || html.includes('font-display');

  if (hasFontBody && hasFontDisplay) {
    score += 1.5;
    details.fontSystem = 'complete';
  } else if (hasFontBody || hasFontDisplay) {
    score += 0.5;
    details.fontSystem = 'partial';
    issues.push({
      severity: 'info',
      location: 'font declarations',
      problem: `Only ${hasFontBody ? 'body' : 'display'} font token used`,
      suggestion: 'Use both --font-body and --font-display tokens',
      code_fix: hasFontBody
        ? 'font-family: var(--font-display);  /* add display font */'
        : 'font-family: var(--font-body);  /* add body font */'
    });
  } else {
    details.fontSystem = 'unknown';
    issues.push({
      severity: 'info',
      location: 'font declarations',
      problem: 'No AetherPane font tokens detected',
      suggestion: 'Use --font-body and --font-display tokens for typography system',
      code_fix: 'font-family: var(--font-body);\n/* headings: font-family: var(--font-display) */'
    });
  }

  const hasClamp = html.includes('clamp(');
  if (hasClamp) {
    score += 1.5;
    details.fluidType = true;
  } else {
    details.fluidType = false;
    issues.push({
      severity: 'warning',
      location: 'heading sizes',
      problem: 'No fluid typography (clamp()) detected',
      suggestion: 'Use clamp() for headings so they scale with viewport',
      code_fix: 'font-size: clamp(3.4rem, 8vw, 6.4rem);  /* hero title */\nfont-size: clamp(2.3rem, 5vw, 4.1rem);  /* section title */'
    });
  }

  const lineHeightMatches = html.match(/line-height:\s*([\d.]+)/g) || [];
  let lineHeightGood = false;
  if (lineHeightMatches.length > 0) {
    const values = lineHeightMatches.map(m => parseFloat(m.match(/[\d.]+/)[0]));
    const inRange = values.filter(v => v >= 1.5 && v <= 2.0);
    if (inRange.length > 0) {
      score += 1;
      lineHeightGood = true;
      details.lineHeight = 'good';
    } else {
      details.lineHeight = 'needs-adjustment';
      issues.push({
        severity: 'warning',
        location: 'text elements',
        problem: `line-height values (${values.join(', ')}) outside optimal range 1.5-2.0`,
        suggestion: 'Set body line-height to 1.6-1.8 for readability',
        code_fix: 'line-height: 1.72;  /* or use AetherPane default */'
      });
    }
  } else {
    details.lineHeight = 'not-set';
    if (!html.includes('line-height')) {
      score += 0.5;
    }
  }

  const hasCardTitle = html.includes('card-title');
  const hasMiniLabel = html.includes('mini-label');
  if (hasCardTitle && hasMiniLabel) {
    score += 1;
    details.contentClasses = 'complete';
  } else if (hasCardTitle || hasMiniLabel) {
    score += 0.5;
    details.contentClasses = 'partial';
    const missing = !hasCardTitle ? 'card-title' : 'mini-label';
    issues.push({
      severity: 'info',
      location: 'card content',
      problem: `Missing .${missing} class for type hierarchy`,
      suggestion: `Use both .card-title and .mini-label for full content hierarchy`,
      code_fix: hasCardTitle
        ? '<p className="mini-label">Label</p>'
        : '<p className="card-title">Title</p>'
    });
  } else {
    details.contentClasses = 'missing';
    issues.push({
      severity: 'info',
      location: 'card content',
      problem: 'No .card-title or .mini-label classes used',
      suggestion: 'Use AetherPane content classes for consistent card typography',
      code_fix: '<p className="mini-label">Category</p>\n<p className="card-title">Title text</p>'
    });
  }

  return { score: clamp(score), details, issues, suggestions };
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

function buildRecommendations(vhr, bsr, gqr, tyr, overall) {
  const recs = [];

  const allIssues = [...vhr.issues, ...bsr.issues, ...gqr.issues, ...tyr.issues];
  const errorCount = allIssues.filter(i => i.severity === 'error').length;
  const warningCount = allIssues.filter(i => i.severity === 'warning').length;

  if (errorCount > 0) {
    recs.push(`Fix ${errorCount} error(s) before deploying — these affect structure or quality standards.`);
  }

  const dimScores = [
    { name: 'Visual Hierarchy', score: vhr.score },
    { name: 'Breathing Space', score: bsr.score },
    { name: 'Glass Quality', score: gqr.score },
    { name: 'Typography', score: tyr.score }
  ].sort((a, b) => a.score - b.score);

  recs.push(`Weakest dimension: ${dimScores[0].name} (${dimScores[0].score}/10) — prioritize improvements here.`);

  if (vhr.score < 7) {
    recs.push('Strengthen visual hierarchy: ensure one h1, clear section headings, and 1-3 primary CTAs.');
  }
  if (bsr.score < 7) {
    recs.push('Improve breathing space: add .section classes, max-width on text, and system gap utilities.');
  }
  if (gqr.score < 7) {
    recs.push('Refine glass usage: reduce to 1-4 surfaces on top-level shells only, avoid nesting.');
  }
  if (tyr.score < 7) {
    recs.push('Upgrade typography: add fluid clamp() headings, font tokens, and content type classes.');
  }

  if (overall >= 9.0) {
    recs.push('Score is exceptional. Focus on micro-polish and edge-case responsiveness.');
  } else if (overall >= 7.5) {
    recs.push('Score is production-ready. Address remaining warnings for a premium finish.');
  }

  return recs;
}

function clamp(value) {
  return parseFloat(Math.max(0, Math.min(10, value)).toFixed(1));
}

function printReport(report) {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║        AetherPane Design Critique            ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  console.log(`File:     ${report.file}`);
  console.log(`Grade:    ${report.grade}  (${report.tier})`);
  console.log(`Overall:  ${report.scores.overall}/10\n`);

  const dims = [
    ['Visual Hierarchy', report.scores.visual_hierarchy],
    ['Breathing Space', report.scores.breathing_space],
    ['Glass Quality', report.scores.glass_quality],
    ['Typography', report.scores.typography]
  ];

  dims.forEach(([name, s]) => {
    const bar = '█'.repeat(Math.round(s)) + '░'.repeat(10 - Math.round(s));
    console.log(`  ${name.padEnd(20)} ${bar} ${s}/10`);
  });

  const allIssues = Object.values(report.dimensions).flatMap(d => d.issues);
  if (allIssues.length > 0) {
    console.log('\nIssues:');
    const grouped = { error: [], warning: [], info: [] };
    allIssues.forEach(i => grouped[i.severity].push(i));
    ['error', 'warning', 'info'].forEach(sev => {
      grouped[sev].forEach(i => {
        const icon = sev === 'error' ? '✖' : sev === 'warning' ? '⚠' : 'ℹ';
        console.log(`  ${icon} [${sev.toUpperCase()}] ${i.location}`);
        console.log(`    ${i.problem}`);
        console.log(`    → ${i.suggestion}`);
      });
    });
  }

  if (report.recommendations.length > 0) {
    console.log('\nRecommendations:');
    report.recommendations.forEach((r, i) => console.log(`  ${i + 1}. ${r}`));
  }

  console.log('');
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const jsonFlag = args.includes('--json');
  const compareIdx = args.indexOf('--compare');
  const comparePath = compareIdx !== -1 ? args[compareIdx + 1] : null;
  const positional = args.filter(a => !a.startsWith('--') && a !== comparePath);

  const target = positional[0];
  if (!target) {
    console.error('Usage: node critique-engine.cjs <file.html|directory> [--json] [--compare previous.json]');
    process.exit(1);
  }

  if (!fs.existsSync(target)) {
    console.error(`Path not found: ${target}`);
    process.exit(1);
  }

  const stat = fs.statSync(target);
  let report;

  if (stat.isDirectory()) {
    report = critiqueDirectory(target, { compare: comparePath });
  } else {
    report = critiqueFile(target);
    if (comparePath) {
      report.comparison = compareWithPrevious([report], comparePath);
    }
  }

  if (jsonFlag) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    if (report.files) {
      report.files.forEach(f => printReport(f));
      console.log('--- Batch Summary ---');
      console.log(`Files: ${report.summary.total_files}`);
      console.log(`Average: ${report.summary.average_score}/10`);
      console.log(`Best: ${report.summary.best}`);
      console.log(`Worst: ${report.summary.worst}`);
    } else {
      printReport(report);
    }
  }

  const exitScore = report.scores ? report.scores.overall : report.summary.average_score;
  process.exit(exitScore >= 7.0 ? 0 : 1);
}

module.exports = { critiqueFile, critiqueDirectory };
