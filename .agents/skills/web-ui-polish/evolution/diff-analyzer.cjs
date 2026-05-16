#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function parseHtmlStructure(html) {
  const tags = {};
  const tagRegex = /<(\w+)[\s>]/g;
  let match;
  while ((match = tagRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    tags[tag] = (tags[tag] || 0) + 1;
  }

  const classes = new Set();
  const classRegex = /class="([^"]+)"/g;
  while ((match = classRegex.exec(html)) !== null) {
    match[1].split(/\s+/).forEach(cls => {
      if (cls) classes.add(cls);
    });
  }

  const sections = [];
  const sectionRegex = /<(section|main|header|footer|nav|aside)[^>]*>/gi;
  while ((match = sectionRegex.exec(html)) !== null) {
    sections.push(match[1].toLowerCase());
  }

  const styles = {};
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  while ((match = styleRegex.exec(html)) !== null) {
    const styleContent = match[1];
    const ruleRegex = /([.#][\w-]+)\s*\{([^}]*)\}/g;
    let ruleMatch;
    while ((ruleMatch = ruleRegex.exec(styleContent)) !== null) {
      styles[ruleMatch[1]] = ruleMatch[2].trim();
    }
  }

  return { tags, classes, sections, styles };
}

function analyzeDiff(file1, file2) {
  const html1 = fs.readFileSync(file1, 'utf8');
  const html2 = fs.readFileSync(file2, 'utf8');

  const struct1 = parseHtmlStructure(html1);
  const struct2 = parseHtmlStructure(html2);

  const tagChanges = computeChanges(struct1.tags, struct2.tags);

  const classChanges = computeSetChanges(struct1.classes, struct2.classes);

  const sectionChanges = {
    added: struct2.sections.filter(s => {
      const count1 = struct1.sections.filter(x => x === s).length;
      const count2 = struct2.sections.filter(x => x === s).length;
      return count2 > count1;
    }).length,
    removed: struct1.sections.filter(s => {
      const count1 = struct1.sections.filter(x => x === s).length;
      const count2 = struct2.sections.filter(x => x === s).length;
      return count1 > count2;
    }).length
  };

  const styleChanges = computeSetChanges(
    new Set(Object.keys(struct1.styles)),
    new Set(Object.keys(struct2.styles))
  );

  const estimatedImpact = estimateScoreImpact(classChanges, sectionChanges, tagChanges);

  const summary = buildSummary(tagChanges, classChanges, sectionChanges, estimatedImpact);

  return {
    file_a: path.basename(file1),
    file_b: path.basename(file2),
    tag_changes: tagChanges,
    class_changes: classChanges,
    section_changes: sectionChanges,
    style_changes: styleChanges,
    estimated_score_impact: estimatedImpact,
    summary
  };
}

function computeChanges(counts1, counts2) {
  const allTags = new Set([...Object.keys(counts1), ...Object.keys(counts2)]);
  const added = [];
  const removed = [];
  let modified = 0;

  for (const tag of allTags) {
    const c1 = counts1[tag] || 0;
    const c2 = counts2[tag] || 0;
    if (c1 === 0 && c2 > 0) added.push(tag);
    else if (c1 > 0 && c2 === 0) removed.push(tag);
    else if (c1 !== c2) modified++;
  }

  return { added, removed, modified };
}

function computeSetChanges(set1, set2) {
  const added = [...set2].filter(x => !set1.has(x));
  const removed = [...set1].filter(x => !set2.has(x));
  const common = [...set1].filter(x => set2.has(x));
  return { added, removed, common: common.length };
}

function estimateScoreImpact(classChanges, sectionChanges, tagChanges) {
  const impact = {
    visual_hierarchy: 0,
    breathing_space: 0,
    glass_quality: 0,
    typography: 0
  };

  const addedClasses = classChanges.added;

  const hierarchyClasses = ['eyebrow', 'lede', 'spotlight', 'card-title', 'mini-label', 'h1', 'h2'];
  const hierarchyHits = addedClasses.filter(c => hierarchyClasses.some(h => c.includes(h))).length;
  impact.visual_hierarchy = parseFloat((hierarchyHits * 0.5).toFixed(1));

  if (sectionChanges.added > 0) {
    impact.visual_hierarchy = parseFloat((impact.visual_hierarchy + sectionChanges.added * 0.3).toFixed(1));
  }

  const spaceClasses = ['section', 'gap', 'space-gap', 'stacked-cards', 'card-row', 'metric-row'];
  const spaceHits = addedClasses.filter(c => spaceClasses.some(s => c.includes(s))).length;
  impact.breathing_space = parseFloat((spaceHits * 0.5).toFixed(1));

  const glassAdded = addedClasses.filter(c => c.includes('glass')).length;
  const glassRemoved = classChanges.removed.filter(c => c.includes('glass')).length;
  if (glassAdded > 0 && glassAdded <= 2) {
    impact.glass_quality = parseFloat((glassAdded * 0.8).toFixed(1));
  } else if (glassAdded > 2) {
    impact.glass_quality = parseFloat((glassAdded * 0.3 - 0.5).toFixed(1));
  }
  if (glassRemoved > 0) {
    impact.glass_quality = parseFloat((impact.glass_quality - glassRemoved * 0.2).toFixed(1));
  }

  const typoClasses = ['font-body', 'font-display', 'card-title', 'mini-label'];
  const typoHits = addedClasses.filter(c => typoClasses.some(t => c.includes(t))).length;
  impact.typography = parseFloat((typoHits * 0.4).toFixed(1));

  if (tagChanges.added.includes('nav') || tagChanges.added.includes('header')) {
    impact.visual_hierarchy = parseFloat((impact.visual_hierarchy + 0.5).toFixed(1));
  }

  return impact;
}

function buildSummary(tagChanges, classChanges, sectionChanges, impact) {
  const parts = [];

  if (tagChanges.added.length > 0) {
    parts.push(`Added ${tagChanges.added.join(', ')} tag(s)`);
  }
  if (tagChanges.removed.length > 0) {
    parts.push(`Removed ${tagChanges.removed.join(', ')} tag(s)`);
  }

  const notableAdded = classChanges.added.filter(c =>
    ['glass', 'section', 'rise', 'eyebrow', 'lede', 'spotlight'].some(k => c.includes(k))
  );
  if (notableAdded.length > 0) {
    parts.push(`Added ${notableAdded.join(', ')} class(es)`);
  }

  if (sectionChanges.added > 0) {
    parts.push(`Added ${sectionChanges.added} section(s)`);
  }
  if (sectionChanges.removed > 0) {
    parts.push(`Removed ${sectionChanges.removed} section(s)`);
  }

  const topImpact = Object.entries(impact)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])[0];
  if (topImpact) {
    const label = topImpact[0].replace(/_/g, ' ');
    parts.push(`Improved ${label} (+${topImpact[1]})`);
  }

  if (parts.length === 0) {
    return 'No significant structural changes detected.';
  }

  return parts.join('. ') + '.';
}

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node diff-analyzer.cjs <file1.html> <file2.html> [--json]');
    process.exit(1);
  }

  const file1 = args[0];
  const file2 = args[1];
  const jsonOutput = args.includes('--json');

  if (!fs.existsSync(file1)) {
    console.error(`File not found: ${file1}`);
    process.exit(1);
  }
  if (!fs.existsSync(file2)) {
    console.error(`File not found: ${file2}`);
    process.exit(1);
  }

  const result = analyzeDiff(file1, file2);

  if (jsonOutput) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`\n=== Diff Analysis: ${result.file_a} → ${result.file_b} ===\n`);

    console.log('Tag Changes:');
    console.log(`  Added:    ${result.tag_changes.added.join(', ') || 'none'}`);
    console.log(`  Removed:  ${result.tag_changes.removed.join(', ') || 'none'}`);
    console.log(`  Modified: ${result.tag_changes.modified}`);

    console.log('\nClass Changes:');
    console.log(`  Added:    ${result.class_changes.added.join(', ') || 'none'}`);
    console.log(`  Removed:  ${result.class_changes.removed.join(', ') || 'none'}`);
    console.log(`  Common:   ${result.class_changes.common}`);

    console.log('\nSection Changes:');
    console.log(`  Added:    ${result.section_changes.added}`);
    console.log(`  Removed:  ${result.section_changes.removed}`);

    console.log('\nEstimated Score Impact:');
    for (const [dim, val] of Object.entries(result.estimated_score_impact)) {
      const label = dim.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const sign = val >= 0 ? '+' : '';
      console.log(`  ${padRight(label, 20)} ${sign}${val}`);
    }

    console.log(`\nSummary: ${result.summary}\n`);
  }
}

function padRight(str, len) {
  return String(str).padEnd(len);
}

module.exports = { analyzeDiff };
