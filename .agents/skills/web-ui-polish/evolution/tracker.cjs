#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const EVOLUTION_DIR = path.resolve(__dirname);
const REPORTS_DIR = path.join(EVOLUTION_DIR, 'reports');

let critiqueFile;
try {
  const critiquePath = path.resolve(__dirname, '..', 'critique', 'critique-engine.cjs');
  critiqueFile = require(critiquePath).critiqueFile;
} catch {
  const { designCritique } = require(path.resolve(__dirname, '..', 'scripts', 'design-critique.cjs'));
  critiqueFile = designCritique;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function initProject(projectName) {
  const projectDir = path.join(REPORTS_DIR, projectName);
  ensureDir(projectDir);

  const manifestPath = path.join(projectDir, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    console.log(`Project "${projectName}" already exists at ${manifestPath}`);
    return null;
  }

  const manifest = {
    project: projectName,
    created: new Date().toISOString(),
    versions: []
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`Initialized project "${projectName}" at ${manifestPath}`);
  return manifest;
}

function saveVersion(projectName, version, description, filePath) {
  const projectDir = path.join(REPORTS_DIR, projectName);
  const manifestPath = path.join(projectDir, 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    console.error(`Project "${projectName}" not found. Run init first.`);
    process.exit(1);
  }

  const defaultHtml = path.resolve(EVOLUTION_DIR, '..', '..', 'index.html');
  const sourceFile = filePath || defaultHtml;

  if (!fs.existsSync(sourceFile)) {
    console.error(`Source file not found: ${sourceFile}`);
    process.exit(1);
  }

  const destFile = path.join(projectDir, `${version}.html`);
  fs.copyFileSync(sourceFile, destFile);

  let report;
  try {
    report = critiqueFile(destFile);
  } catch {
    console.warn('Critique engine unavailable, saving without scores.');
    report = {
      scores: {
        visual_hierarchy: 0,
        breathing_space: 0,
        glass_quality: 0,
        typography: 0,
        overall: 0
      }
    };
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  const existingIdx = manifest.versions.findIndex(v => v.version === version);
  const changes = [];
  if (manifest.versions.length > 0 && existingIdx === -1) {
    const prev = manifest.versions[manifest.versions.length - 1];
    const prevScore = prev.score || 0;
    const currScore = report.scores.overall;
    if (currScore > prevScore) changes.push(`Score improved from ${prevScore} to ${currScore}`);
    else if (currScore < prevScore) changes.push(`Score declined from ${prevScore} to ${currScore}`);
    else changes.push(`Score unchanged at ${currScore}`);
  }

  const entry = {
    version,
    timestamp: new Date().toISOString(),
    file: `reports/${projectName}/${version}.html`,
    description,
    score: report.scores.overall,
    breakdown: {
      visual_hierarchy: report.scores.visual_hierarchy,
      breathing_space: report.scores.breathing_space,
      glass_quality: report.scores.glass_quality,
      typography: report.scores.typography
    },
    changes
  };

  if (existingIdx >= 0) {
    manifest.versions[existingIdx] = entry;
  } else {
    manifest.versions.push(entry);
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`Saved ${version} for "${projectName}" (score: ${entry.score})`);
  if (report.scores) {
    console.log(`  Visual Hierarchy: ${report.scores.visual_hierarchy}`);
    console.log(`  Breathing Space:  ${report.scores.breathing_space}`);
    console.log(`  Glass Quality:    ${report.scores.glass_quality}`);
    console.log(`  Typography:       ${report.scores.typography}`);
  }

  return entry;
}

function showHistory(projectName) {
  const manifestPath = path.join(REPORTS_DIR, projectName, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error(`Project "${projectName}" not found.`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  console.log(`\n=== Version History: ${manifest.project} ===\n`);
  console.log('Version    Date                 Score  Description');
  console.log('---------- -------------------- ------ -----------');

  for (const v of manifest.versions) {
    const date = v.timestamp ? v.timestamp.slice(0, 19).replace('T', ' ') : 'unknown';
    const score = typeof v.score === 'number' ? v.score.toFixed(1) : 'n/a';
    console.log(
      `${padRight(v.version, 10)} ${date} ${padLeft(score, 6)}  ${v.description}`
    );
  }

  if (manifest.versions.length > 1) {
    const first = manifest.versions[0].score || 0;
    const last = manifest.versions[manifest.versions.length - 1].score || 0;
    const diff = last - first;
    console.log(`\nTotal score evolution: ${first.toFixed(1)} → ${last.toFixed(1)} (${diff >= 0 ? '+' : ''}${diff.toFixed(1)})`);
  }

  console.log('');
}

function generateReport(projectName) {
  const manifestPath = path.join(REPORTS_DIR, projectName, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error(`Project "${projectName}" not found.`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const versions = manifest.versions;

  if (versions.length === 0) {
    console.log(`No versions recorded for "${projectName}".`);
    return;
  }

  console.log(`\n╔══════════════════════════════════════════════════════════════════╗`);
  console.log(`║  Design Evolution Report: ${padRight(manifest.project, 38)} ║`);
  console.log(`╚══════════════════════════════════════════════════════════════════╝\n`);

  console.log('Version   VH    BS    GQ    TY    Overall  Description');
  console.log('────────  ────  ────  ────  ────  ───────  ───────────');

  for (const v of versions) {
    const b = v.breakdown || {};
    console.log(
      `${padRight(v.version, 9)} ${padLeft(fmt(b.visual_hierarchy), 4)}  ${padLeft(fmt(b.breathing_space), 4)}  ${padLeft(fmt(b.glass_quality), 4)}  ${padLeft(fmt(b.typography), 4)}  ${padLeft(fmt(v.score), 7)}  ${v.description}`
    );
  }

  console.log('');

  if (versions.length > 1) {
    const dims = ['visual_hierarchy', 'breathing_space', 'glass_quality', 'typography'];
    console.log('Score Progression by Dimension:');
    for (const dim of dims) {
      const vals = versions.map(v => (v.breakdown && v.breakdown[dim]) || 0);
      const trend = vals[vals.length - 1] - vals[0];
      const arrow = trend > 0 ? '↑' : trend < 0 ? '↓' : '→';
      const label = dim.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      console.log(`  ${padRight(label, 20)} ${vals.map(v => v.toFixed(1)).join(' → ')} ${arrow}${trend >= 0 ? '+' : ''}${trend.toFixed(1)}`);
    }

    const scores = versions.map(v => v.score || 0);
    const best = Math.max(...scores);
    const worst = Math.min(...scores);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

    console.log(`\nBest version:  ${versions[scores.indexOf(best)].version} (${best.toFixed(1)})`);
    console.log(`Worst version: ${versions[scores.indexOf(worst)].version} (${worst.toFixed(1)})`);
    console.log(`Average score: ${avg.toFixed(1)}`);

    const insights = generateInsights(versions);
    if (insights.length > 0) {
      console.log('\nInsights:');
      for (const ins of insights) {
        console.log(`  - ${ins}`);
      }
    }
  }

  console.log('');
}

function generateInsights(versions) {
  const insights = [];

  if (versions.length < 2) return insights;

  const dims = ['visual_hierarchy', 'breathing_space', 'glass_quality', 'typography'];
  let bestDim = '';
  let bestImprovement = -Infinity;

  for (const dim of dims) {
    const first = (versions[0].breakdown && versions[0].breakdown[dim]) || 0;
    const last = (versions[versions.length - 1].breakdown && versions[versions.length - 1].breakdown[dim]) || 0;
    const improvement = last - first;
    if (improvement > bestImprovement) {
      bestImprovement = improvement;
      bestDim = dim;
    }
  }

  if (bestDim && bestImprovement > 0) {
    const label = bestDim.replace(/_/g, ' ');
    insights.push(`Most improved dimension: ${label} (+${bestImprovement.toFixed(1)})`);
  }

  const totalChange = (versions[versions.length - 1].score || 0) - (versions[0].score || 0);
  if (totalChange >= 2) {
    insights.push('Strong overall improvement across versions');
  } else if (totalChange <= -1) {
    insights.push('Overall score declined — consider reviewing recent changes');
  }

  const firstScore = versions[0].score || 0;
  const lastScore = versions[versions.length - 1].score || 0;
  if (firstScore < 6 && lastScore >= 7) {
    insights.push('Crossed from below-standard to production-ready territory');
  } else if (firstScore < 7.5 && lastScore >= 7.5) {
    insights.push('Reached production-ready quality tier');
  }

  const recentVersions = versions.slice(-3);
  const recentScores = recentVersions.map(v => v.score || 0);
  const recentTrend = recentScores.length > 1
    ? recentScores[recentScores.length - 1] - recentScores[0]
    : 0;
  if (recentTrend < 0 && versions.length > 3) {
    insights.push('Recent versions show declining scores — may need course correction');
  }

  return insights;
}

function fmt(val) {
  return typeof val === 'number' ? val.toFixed(1) : 'n/a';
}

function padRight(str, len) {
  return String(str).padEnd(len);
}

function padLeft(str, len) {
  return String(str).padStart(len);
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log('Usage:');
    console.log('  node tracker.cjs init <project-name>');
    console.log('  node tracker.cjs save <project-name> <version> <description> [--file <path>]');
    console.log('  node tracker.cjs history <project-name>');
    console.log('  node tracker.cjs report <project-name>');
    process.exit(0);
  }

  switch (command) {
    case 'init': {
      const name = args[1];
      if (!name) {
        console.error('Usage: node tracker.cjs init <project-name>');
        process.exit(1);
      }
      initProject(name);
      break;
    }
    case 'save': {
      const name = args[1];
      const version = args[2];
      const fileIdx = args.indexOf('--file');
      let description;
      let file;
      if (fileIdx >= 0) {
        file = args[fileIdx + 1];
        description = args.slice(3, fileIdx).join(' ');
      } else {
        description = args.slice(3).join(' ');
      }
      if (!name || !version) {
        console.error('Usage: node tracker.cjs save <project-name> <version> <description> [--file <path>]');
        process.exit(1);
      }
      saveVersion(name, version, description || 'No description', file);
      break;
    }
    case 'history': {
      const name = args[1];
      if (!name) {
        console.error('Usage: node tracker.cjs history <project-name>');
        process.exit(1);
      }
      showHistory(name);
      break;
    }
    case 'report': {
      const name = args[1];
      if (!name) {
        console.error('Usage: node tracker.cjs report <project-name>');
        process.exit(1);
      }
      generateReport(name);
      break;
    }
    default:
      console.error(`Unknown command: ${command}`);
      console.log('Commands: init, save, history, report');
      process.exit(1);
  }
}

module.exports = { initProject, saveVersion, showHistory, generateReport };
