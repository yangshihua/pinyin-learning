#!/usr/bin/env node

const fs = require('fs');

function designCritique(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const report = {
    file: filePath,
    scores: {
      visual_hierarchy: 0,
      breathing_space: 0,
      glass_quality: 0,
      typography: 0,
      overall: 0
    },
    tier: '',
    details: {},
    suggestions: []
  };

  const vhs = scoreVisualHierarchy(html);
  const bsa = scoreBreathingSpace(html);
  const gqm = scoreGlassQuality(html);
  const trs = scoreTypography(html);

  report.scores.visual_hierarchy = vhs.score;
  report.scores.breathing_space = bsa.score;
  report.scores.glass_quality = gqm.score;
  report.scores.typography = trs.score;
  report.scores.overall = parseFloat(
    (vhs.score * 0.30 + bsa.score * 0.25 + gqm.score * 0.20 + trs.score * 0.25).toFixed(1)
  );

  report.details = {
    heading_contrast: vhs.details.headingContrast,
    glass_usage: gqm.details.glassUsage,
    cta_count: vhs.details.ctaCount,
    section_count: vhs.details.sectionCount,
    glass_count: gqm.details.glassCount,
    glass_nesting: gqm.details.glassNesting
  };

  report.suggestions = [
    ...vhs.suggestions,
    ...bsa.suggestions,
    ...gqm.suggestions,
    ...trs.suggestions
  ];

  if (report.scores.overall >= 9.0) report.tier = 'exceptional';
  else if (report.scores.overall >= 7.5) report.tier = 'production-ready';
  else if (report.scores.overall >= 6.0) report.tier = 'acceptable';
  else if (report.scores.overall >= 4.0) report.tier = 'below-standard';
  else report.tier = 'unusable';

  return report;
}

function scoreVisualHierarchy(html) {
  let score = 5;
  const suggestions = [];
  const details = {};

  const sectionCount = (html.match(/<section/g) || []).length;
  const mainCount = (html.match(/<main/g) || []).length;
  details.sectionCount = sectionCount + mainCount;

  if (sectionCount + mainCount >= 3) score += 1.5;
  else if (sectionCount + mainCount >= 2) score += 0.5;
  else suggestions.push('Add more sections (target: 3+) for complete page rhythm');

  const h1Count = (html.match(/<h1/g) || []).length;
  const h2Count = (html.match(/<h2/g) || []).length;
  const hasEyebrow = html.includes('eyebrow');
  const hasLede = html.includes('lede');

  if (h1Count === 1 && h2Count >= 1) {
    score += 1.5;
    details.headingContrast = 'strong';
  } else if (h1Count === 1) {
    score += 0.5;
    details.headingContrast = 'moderate';
    suggestions.push('Add h2 headings for section titles');
  } else {
    details.headingContrast = 'weak';
    if (h1Count === 0) suggestions.push('Add an h1 for the page title');
    if (h1Count > 1) suggestions.push('Use only one h1 per page');
  }

  if (hasEyebrow) score += 0.5;
  if (hasLede) score += 0.5;

  const primaryButtons = (html.match(/button primary|btn-primary/g) || []).length;
  details.ctaCount = primaryButtons;
  if (primaryButtons >= 1 && primaryButtons <= 3) score += 1;
  else if (primaryButtons > 3) {
    score -= 0.5;
    suggestions.push('Too many primary CTAs - use one per section cluster');
  } else {
    suggestions.push('Add at least one primary CTA button');
  }

  const hasSpotlight = html.includes('spotlight');
  if (hasSpotlight) score += 0.5;

  return { score: clamp(score), details, suggestions };
}

function scoreBreathingSpace(html) {
  let score = 5;
  const suggestions = [];
  const details = {};

  const hasSection = html.includes('class="section"') || html.includes("class='section'") || html.includes('.section');
  if (hasSection) {
    score += 1.5;
    details.sectionSpacing = 'system-class';
  } else {
    details.sectionSpacing = 'unknown';
    suggestions.push('Use the .section class for consistent section spacing');
  }

  const hasSpaceSection = html.includes('--space-section') || html.includes('space-section');
  if (hasSpaceSection) score += 1;

  const gapClasses = ['gap', 'space-gap', 'card-row', 'stacked-cards', 'metric-row'];
  const gapCount = gapClasses.filter(cls => html.includes(cls)).length;
  details.gapUsage = gapCount;
  if (gapCount >= 2) score += 1;
  else suggestions.push('Use system gap utilities for consistent element spacing');

  const paddingMatches = html.match(/padding:\s*\d+px/g) || [];
  const largePadding = paddingMatches.filter(p => {
    const val = parseInt(p.match(/\d+/)[0]);
    return val >= 60;
  });
  if (largePadding.length > 0) score += 0.5;

  const maxLineLength = html.includes('max-width') && html.includes('ch');
  if (maxLineLength) score += 1;
  else suggestions.push('Add max-width (55-70ch) on text blocks for readability');

  return { score: clamp(score), details, suggestions };
}

function scoreGlassQuality(html) {
  let score = 5;
  const suggestions = [];
  const details = {};

  const glassCount = (html.match(/class="[^"]*glass[^"]*"/g) || []).length;
  details.glassCount = glassCount;

  const nestedGlass = html.match(/<[^>]*glass[^>]*>[\s\S]*?<[^>]*glass[^>]*>/g) || [];
  details.glassNesting = nestedGlass.length;

  const appropriateShells = ['topbar', 'hero-panel', 'dashboard-nav', 'modal-shell', 'drawer-shell', 'theme-dock'];
  const glassOnShells = appropriateShells.filter(shell => {
    const pattern = new RegExp(`class="[^"]*${shell}[^"]*glass[^"]*"|class="[^"]*glass[^"]*${shell}[^"]*"`);
    return pattern.test(html);
  }).length;

  if (glassCount === 0) {
    score = 7;
    details.glassUsage = 'none';
    suggestions.push('Consider adding glass to one premium shell (topbar, hero-panel)');
  } else if (glassCount === 1 || glassCount === 2) {
    score = 9;
    details.glassUsage = 'minimal';
  } else if (glassCount <= 4 && glassOnShells >= 1) {
    score = 8;
    details.glassUsage = 'appropriate';
  } else if (glassCount <= 6) {
    score = 6;
    details.glassUsage = 'moderate';
    suggestions.push('Reduce glass usage - reserve for top-level shells only');
  } else {
    score = 3;
    details.glassUsage = 'excessive';
    suggestions.push('Too much glass - remove from content cards and use only on shells');
  }

  if (nestedGlass.length > 0) {
    score -= 2;
    suggestions.push('Nested glass detected - keep child elements solid for readability');
  }

  return { score: clamp(score), details, suggestions };
}

function scoreTypography(html) {
  let score = 5;
  const suggestions = [];
  const details = {};

  const hasFontBody = html.includes('--font-body') || html.includes('font-body');
  const hasFontDisplay = html.includes('--font-display') || html.includes('font-display');
  if (hasFontBody && hasFontDisplay) {
    score += 1.5;
    details.fontSystem = 'complete';
  } else if (hasFontBody || hasFontDisplay) {
    score += 0.5;
    details.fontSystem = 'partial';
  } else {
    details.fontSystem = 'unknown';
  }

  const hasClamp = html.includes('clamp(');
  if (hasClamp) {
    score += 1.5;
    details.fluidType = true;
  } else {
    details.fluidType = false;
    suggestions.push('Use clamp() for fluid typography that scales with viewport');
  }

  const hasLineHeight = html.match(/line-height:\s*[\d.]+/);
  if (hasLineHeight) {
    const lh = parseFloat(hasLineHeight[0].match(/[\d.]+/)[0]);
    if (lh >= 1.5 && lh <= 2.0) {
      score += 1;
      details.lineHeight = 'good';
    } else {
      details.lineHeight = 'needs-adjustment';
      suggestions.push('Body line-height should be 1.5-1.8 for readability');
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
    suggestions.push('Use both card-title and mini-label for full type hierarchy');
  }

  return { score: clamp(score), details, suggestions };
}

function clamp(value) {
  return parseFloat(Math.max(0, Math.min(10, value)).toFixed(1));
}

function printReport(report) {
  console.log('\n=== Design Critique Report ===\n');
  console.log(`File: ${report.file}`);
  console.log(`Overall Score: ${report.scores.overall}/10 (${report.tier})\n`);

  console.log('Dimension Scores:');
  console.log(`  Visual Hierarchy:  ${report.scores.visual_hierarchy}/10`);
  console.log(`  Breathing Space:   ${report.scores.breathing_space}/10`);
  console.log(`  Glass Quality:     ${report.scores.glass_quality}/10`);
  console.log(`  Typography:        ${report.scores.typography}/10`);

  console.log('\nDetails:');
  Object.entries(report.details).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });

  if (report.suggestions.length > 0) {
    console.log('\nSuggestions:');
    report.suggestions.forEach(s => console.log(`  - ${s}`));
  }

  console.log('\nQuality Tiers:');
  console.log('  9.0-10.0  Exceptional');
  console.log('  7.5-8.9   Production-ready');
  console.log('  6.0-7.4   Acceptable');
  console.log('  4.0-5.9   Below standard');
  console.log('  0.0-3.9   Unusable');
  console.log('');
}

if (require.main === module) {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error('Usage: node design-critique.js <file.html>');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const report = designCritique(filePath);
  printReport(report);

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(report, null, 2));
  }

  process.exit(report.scores.overall >= 7.0 ? 0 : 1);
}

module.exports = { designCritique };
