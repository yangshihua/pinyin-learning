#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { analyzeDiff } = require('./diff-analyzer.cjs');

const EVOLUTION_DIR = path.resolve(__dirname);
const REPORTS_DIR = path.join(EVOLUTION_DIR, 'reports');

function extractPatterns(projectName) {
  const manifestPath = path.join(REPORTS_DIR, projectName, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error(`Project "${projectName}" not found.`);
    return null;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const versions = manifest.versions;

  if (versions.length < 2) {
    return {
      project: projectName,
      patterns: [],
      insights: ['Not enough versions to extract patterns (need at least 2)']
    };
  }

  const diffs = [];
  for (let i = 1; i < versions.length; i++) {
    const prev = versions[i - 1];
    const curr = versions[i];
    const prevFile = path.resolve(REPORTS_DIR, prev.file);
    const currFile = path.resolve(REPORTS_DIR, curr.file);

    if (fs.existsSync(prevFile) && fs.existsSync(currFile)) {
      try {
        const diff = analyzeDiff(prevFile, currFile);
        diffs.push({
          from: prev.version,
          to: curr.version,
          diff,
          prevScore: prev.score || 0,
          currScore: curr.score || 0,
          prevBreakdown: prev.breakdown || {},
          currBreakdown: curr.breakdown || {}
        });
      } catch {
        diffs.push({
          from: prev.version,
          to: curr.version,
          diff: null,
          prevScore: prev.score || 0,
          currScore: curr.score || 0,
          prevBreakdown: prev.breakdown || {},
          currBreakdown: curr.breakdown || {}
        });
      }
    }
  }

  const patternMap = {};

  for (const d of diffs) {
    if (!d.diff) continue;

    for (const cls of d.diff.class_changes.added) {
      const patternName = classifyClassAddition(cls);
      if (!patternMap[patternName]) {
        patternMap[patternName] = {
          name: patternName,
          description: describePattern(patternName),
          frequency: 0,
          totalScoreImprovement: 0,
          affectedDimensions: new Set()
        };
      }
      patternMap[patternName].frequency++;
      const scoreDelta = d.currScore - d.prevScore;
      patternMap[patternName].totalScoreImprovement += scoreDelta;

      const dims = d.diff.estimated_score_impact || {};
      for (const [dim, val] of Object.entries(dims)) {
        if (val > 0) patternMap[patternName].affectedDimensions.add(dim);
      }
    }

    if (d.diff.section_changes.added > 0) {
      const pName = 'add-section';
      if (!patternMap[pName]) {
        patternMap[pName] = {
          name: pName,
          description: 'Adding new page sections for structure',
          frequency: 0,
          totalScoreImprovement: 0,
          affectedDimensions: new Set()
        };
      }
      patternMap[pName].frequency += d.diff.section_changes.added;
      patternMap[pName].totalScoreImprovement += d.currScore - d.prevScore;
      patternMap[pName].affectedDimensions.add('visual_hierarchy');
      patternMap[pName].affectedDimensions.add('breathing_space');
    }

    if (d.diff.tag_changes.added.includes('nav')) {
      const pName = 'add-navigation';
      if (!patternMap[pName]) {
        patternMap[pName] = {
          name: pName,
          description: 'Adding navigation element',
          frequency: 0,
          totalScoreImprovement: 0,
          affectedDimensions: new Set()
        };
      }
      patternMap[pName].frequency++;
      patternMap[pName].totalScoreImprovement += d.currScore - d.prevScore;
      patternMap[pName].affectedDimensions.add('visual_hierarchy');
    }
  }

  const patterns = Object.values(patternMap)
    .map(p => ({
      name: p.name,
      description: p.description,
      frequency: p.frequency,
      avg_score_improvement: parseFloat((p.totalScoreImprovement / p.frequency).toFixed(2)),
      affected_dimensions: [...p.affectedDimensions]
    }))
    .sort((a, b) => b.avg_score_improvement - a.avg_score_improvement);

  const insights = generatePatternInsights(patterns, versions, diffs);

  const result = {
    project: projectName,
    patterns,
    insights
  };

  return result;
}

function classifyClassAddition(cls) {
  if (cls.includes('glass')) return 'add-glass-surface';
  if (cls.includes('rise')) return 'add-motion-rise';
  if (cls.includes('eyebrow')) return 'add-eyebrow-label';
  if (cls.includes('lede')) return 'add-lede-paragraph';
  if (cls.includes('section')) return 'use-section-spacing';
  if (cls.includes('spotlight')) return 'add-spotlight-focus';
  if (cls.includes('card')) return 'add-card-component';
  if (cls.includes('button') || cls.includes('btn')) return 'add-cta-button';
  if (cls.includes('metric')) return 'add-metric-display';
  if (cls.includes('panel')) return 'add-panel-component';
  if (cls.includes('hero')) return 'add-hero-section';
  if (cls.includes('nav')) return 'add-navigation-shell';
  if (cls.includes('gap') || cls.includes('space')) return 'add-spacing-utility';
  return `add-class-${cls}`;
}

function describePattern(patternName) {
  const descriptions = {
    'add-glass-surface': 'Adding glass effect to a UI surface',
    'add-motion-rise': 'Adding rise entrance animation to elements',
    'add-eyebrow-label': 'Adding eyebrow label for section hierarchy',
    'add-lede-paragraph': 'Adding lede paragraph for hero sections',
    'use-section-spacing': 'Using system section spacing classes',
    'add-spotlight-focus': 'Adding spotlight emphasis to focal elements',
    'add-card-component': 'Adding card component structure',
    'add-cta-button': 'Adding call-to-action button',
    'add-metric-display': 'Adding metric display component',
    'add-panel-component': 'Adding content panel component',
    'add-hero-section': 'Adding hero section structure',
    'add-navigation-shell': 'Adding navigation shell',
    'add-spacing-utility': 'Adding spacing utility classes'
  };
  return descriptions[patternName] || `Pattern: ${patternName}`;
}

function generatePatternInsights(patterns, versions, diffs) {
  const insights = [];

  if (patterns.length === 0) {
    insights.push('No recurring patterns detected yet');
    return insights;
  }

  const bestPattern = patterns.reduce((a, b) =>
    a.avg_score_improvement > b.avg_score_improvement ? a : b
  );
  if (bestPattern.avg_score_improvement > 0) {
    insights.push(
      `Most impactful improvement: ${bestPattern.description} (+${bestPattern.avg_score_improvement.toFixed(1)} avg)`
    );
  }

  const glassPatterns = patterns.filter(p => p.name.includes('glass'));
  if (glassPatterns.length > 0 && glassPatterns[0].avg_score_improvement > 0) {
    insights.push('Glass effects on shells consistently improve scores');
  }

  const motionPatterns = patterns.filter(p => p.name.includes('motion') || p.name.includes('rise'));
  if (motionPatterns.length > 0) {
    insights.push(`Motion patterns used ${motionPatterns.reduce((s, p) => s + p.frequency, 0)} time(s) across evolution`);
  }

  const sectionPatterns = patterns.filter(p => p.name.includes('section'));
  if (sectionPatterns.length > 0 && sectionPatterns[0].avg_score_improvement > 0) {
    insights.push('Section structure improvements yield consistent score gains');
  }

  const totalScoreDelta = (versions[versions.length - 1].score || 0) - (versions[0].score || 0);
  if (totalScoreDelta >= 3) {
    insights.push('Strong overall design evolution — significant quality improvement');
  } else if (totalScoreDelta >= 1) {
    insights.push('Steady design improvement across versions');
  } else if (totalScoreDelta < 0) {
    insights.push('Design quality declined — review recent changes for regressions');
  }

  const frequentPatterns = patterns.filter(p => p.frequency >= 2);
  if (frequentPatterns.length > 0) {
    insights.push(
      `Most repeated operation: ${frequentPatterns[0].description} (${frequentPatterns[0].frequency} times)`
    );
  }

  const dims = ['visual_hierarchy', 'breathing_space', 'glass_quality', 'typography'];
  for (const dim of dims) {
    const relatedPatterns = patterns.filter(p => p.affected_dimensions.includes(dim));
    if (relatedPatterns.length > 0) {
      const totalImpact = relatedPatterns.reduce((s, p) => s + p.avg_score_improvement, 0);
      if (totalImpact > 1) {
        const label = dim.replace(/_/g, ' ');
        insights.push(`${label} benefited most from: ${relatedPatterns.map(p => p.name).join(', ')}`);
      }
    }
  }

  return insights;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const projectName = args[0];
  const jsonOutput = args.includes('--json');

  if (!projectName) {
    console.error('Usage: node pattern-extractor.cjs <project-name> [--json]');
    process.exit(1);
  }

  const result = extractPatterns(projectName);
  if (!result) process.exit(1);

  if (jsonOutput) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`\n=== Pattern Analysis: ${result.project} ===\n`);

    if (result.patterns.length === 0) {
      console.log('No patterns detected.');
    } else {
      console.log('Detected Patterns:\n');
      console.log('Pattern                   Freq  Avg Impact  Dimensions');
      console.log('────────────────────────  ────  ──────────  ──────────');

      for (const p of result.patterns) {
        const dimStr = p.affected_dimensions.slice(0, 2).map(d => d.replace(/_/g, ' ')).join(', ');
        console.log(
          `${padRight(p.name, 25)} ${padLeft(String(p.frequency), 4)}  ${padLeft('+' + p.avg_score_improvement.toFixed(1), 10)}  ${dimStr}`
        );
      }
    }

    if (result.insights.length > 0) {
      console.log('\nInsights:');
      for (const ins of result.insights) {
        console.log(`  - ${ins}`);
      }
    }

    console.log('');
  }
}

function padRight(str, len) {
  return String(str).padEnd(len);
}

function padLeft(str, len) {
  return String(str).padStart(len);
}

module.exports = { extractPatterns };
