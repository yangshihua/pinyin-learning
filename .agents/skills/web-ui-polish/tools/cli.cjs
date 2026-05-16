#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const SKILL_DIR = path.resolve(__dirname, '..');
const COMMANDS = {
  critique: 'Run design critique on HTML files',
  track: 'Design evolution tracking',
  collab: 'Multi-agent collaboration tools',
  pattern: 'Design pattern management',
  generate: 'Generate pages from patterns'
};

function printHelp() {
  console.log(`
AetherPane CLI - Premium UI Design System

Usage: aetherpane <command> [options]

Commands:
  critique <file|dir>     Run design critique on HTML file(s)
  track <subcommand>      Design evolution tracking (init|save|history|report)
  collab <subcommand>     Collaboration tools (list|show|allocate|optimize)
  pattern <subcommand>    Pattern management (list|show|build)
  generate <page-type>    Generate a page from patterns

Options:
  --help                  Show this help message
  --version               Show version
  --json                  Output raw JSON
  --theme <theme>         Theme (classic|editorial|signal)
  --output <file>         Output file path
  --compare <file>        Compare against previous score JSON

Examples:
  aetherpane critique examples/landing-classic.html
  aetherpane critique examples/ --json
  aetherpane track init my-project
  aetherpane track save my-project v1 "Initial" --file page.html
  aetherpane collab allocate --requirements semantic_html,copywriting
  aetherpane pattern list
  aetherpane pattern build --hero hero-centered-cta --theme classic --output page.html
`);
}

function runCommand(cmd, args) {
  switch (cmd) {
    case 'critique':
      return runCritique(args);
    case 'track':
      return runTrack(args);
    case 'collab':
      return runCollab(args);
    case 'pattern':
      return runPattern(args);
    case 'generate':
      return runGenerate(args);
    default:
      console.error(`Unknown command: ${cmd}`);
      console.log('Run "aetherpane --help" for available commands.');
      process.exit(1);
  }
}

function runCritique(args) {
  if (!args.length || args[0] === '--help') {
    console.log(`
Usage: aetherpane critique <file|dir> [options]

Options:
  --json         Output raw JSON
  --compare <f>  Compare against previous score JSON
  --format <fmt> Report format (json|html|markdown)

Examples:
  aetherpane critique examples/landing-classic.html
  aetherpane critique examples/ --json
`);
    return;
  }

  const target = args[0];
  const opts = parseArgs(args.slice(1));

  try {
    const enginePath = path.join(SKILL_DIR, 'critique', 'critique-engine.cjs');
    const engine = require(enginePath);

    if (!fs.existsSync(target)) {
      console.error(`Target not found: ${target}`);
      process.exit(1);
    }

    const stat = fs.statSync(target);
    let result;

    if (stat.isDirectory()) {
      result = engine.critiqueDirectory(target);
      if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        result.forEach(r => printCritiqueSummary(r));
      }
    } else {
      result = engine.critiqueFile(target);
      if (opts.compare && fs.existsSync(opts.compare)) {
        const prev = JSON.parse(fs.readFileSync(opts.compare, 'utf8'));
        const delta = result.scores.overall - (prev.overall_score || prev.scores?.overall || 0);
        console.log(`\nComparison: ${delta >= 0 ? '+' : ''}${delta.toFixed(1)} (${prev.overall_score || prev.scores?.overall} -> ${result.scores.overall})`);
      }
      if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        printCritiqueSummary(result);
      }
    }
  } catch (err) {
    console.error(`Critique error: ${err.message}`);
    process.exit(1);
  }
}

function printCritiqueSummary(report) {
  console.log(`\n=== ${report.file || 'Report'} ===`);
  console.log(`Overall: ${report.scores.overall}/10`);
  console.log(`  Visual Hierarchy: ${report.scores.visual_hierarchy}/10`);
  console.log(`  Breathing Space:  ${report.scores.breathing_space}/10`);
  console.log(`  Glass Quality:    ${report.scores.glass_quality}/10`);
  console.log(`  Typography:       ${report.scores.typography}/10`);
  if (report.suggestions && report.suggestions.length > 0) {
    console.log(`  Suggestions: ${report.suggestions.length}`);
  }
}

function runTrack(args) {
  if (!args.length || args[0] === '--help') {
    console.log(`
Usage: aetherpane track <subcommand> [options]

Subcommands:
  init <name>                      Initialize tracking project
  save <name> <ver> <desc>         Save version (--file <path>)
  history <name>                   View version history
  report <name>                    Generate evolution report
  diff <file1> <file2>             Compare two HTML files
  patterns <name>                  Extract improvement patterns

Examples:
  aetherpane track init landing-page
  aetherpane track save landing-page v1 "Initial" --file page.html
  aetherpane track history landing-page
`);
    return;
  }

  const sub = args[0];
  const subArgs = args.slice(1);

  try {
    switch (sub) {
      case 'init':
      case 'save':
      case 'history':
      case 'report': {
        const tracker = require(path.join(SKILL_DIR, 'evolution', 'tracker.cjs'));
        const opts = parseArgs(subArgs);
        if (sub === 'init') tracker.initProject(subArgs[0]);
        else if (sub === 'save') tracker.saveVersion(subArgs[0], subArgs[1], subArgs.slice(2).join(' ') || 'No description', opts.file);
        else if (sub === 'history') tracker.showHistory(subArgs[0]);
        else tracker.generateReport(subArgs[0]);
        break;
      }
      case 'diff': {
        const diff = require(path.join(SKILL_DIR, 'evolution', 'diff-analyzer.cjs'));
        if (subArgs.length < 2) { console.error('Usage: aetherpane track diff <file1> <file2>'); process.exit(1); }
        const result = diff.analyzeDiff(subArgs[0], subArgs[1]);
        if (opts?.json) console.log(JSON.stringify(result, null, 2));
        else console.log(result.summary || JSON.stringify(result, null, 2));
        break;
      }
      case 'patterns': {
        const extractor = require(path.join(SKILL_DIR, 'evolution', 'pattern-extractor.cjs'));
        const result = extractor.extractPatterns(subArgs[0]);
        console.log(JSON.stringify(result, null, 2));
        break;
      }
      default:
        console.error(`Unknown track subcommand: ${sub}`);
    }
  } catch (err) {
    console.error(`Track error: ${err.message}`);
    process.exit(1);
  }
}

function runCollab(args) {
  if (!args.length || args[0] === '--help') {
    console.log(`
Usage: aetherpane collab <subcommand> [options]

Subcommands:
  list                            List all agents
  show <agent>                    Show agent details
  allocate --requirements <list>  Find best agent for task
  optimize <workflow.json>        Optimize collaboration workflow

Examples:
  aetherpane collab list
  aetherpane collab show claude-code
  aetherpane collab allocate --requirements semantic_html,copywriting
`);
    return;
  }

  const sub = args[0];
  const subArgs = args.slice(1);

  try {
    switch (sub) {
      case 'list': {
        const profiler = require(path.join(SKILL_DIR, 'collaboration', 'agent-profiler.cjs'));
        profiler.listAgents();
        break;
      }
      case 'show': {
        const profiler = require(path.join(SKILL_DIR, 'collaboration', 'agent-profiler.cjs'));
        profiler.showAgent(subArgs[0]);
        break;
      }
      case 'allocate': {
        const allocator = require(path.join(SKILL_DIR, 'collaboration', 'task-allocator.cjs'));
        const opts = parseArgs(subArgs);
        const requirements = (opts.requirements || '').split(',').filter(Boolean);
        if (!requirements.length) { console.error('Provide --requirements <comma-separated-list>'); process.exit(1); }
        const result = allocator.allocateTask({ requirements });
        console.log(`Recommended: ${result.recommended}`);
        console.log(`\nAll candidates:`);
        result.rankings.forEach(r => console.log(`  ${r.agent}: ${r.score} (${r.matched_strengths.length} strengths matched)`));
        break;
      }
      case 'optimize': {
        const optimizer = require(path.join(SKILL_DIR, 'collaboration', 'workflow-optimizer.cjs'));
        if (!subArgs[0]) { console.error('Provide workflow JSON file'); process.exit(1); }
        const workflow = JSON.parse(fs.readFileSync(subArgs[0], 'utf8'));
        const result = optimizer.optimizeWorkflow(workflow);
        console.log(JSON.stringify(result, null, 2));
        break;
      }
      default:
        console.error(`Unknown collab subcommand: ${sub}`);
    }
  } catch (err) {
    console.error(`Collab error: ${err.message}`);
    process.exit(1);
  }
}

function runPattern(args) {
  if (!args.length || args[0] === '--help') {
    console.log(`
Usage: aetherpane pattern <subcommand> [options]

Subcommands:
  list                            List available patterns
  show <pattern-id>               Show pattern details
  build [options]                 Build page from patterns

Build options:
  --hero <id>       Hero pattern
  --features <id>   Feature cards pattern
  --cta-band        Include CTA section
  --theme <theme>   Theme (classic|editorial|signal)
  --title <string>  Page title
  --output <file>   Output file

Examples:
  aetherpane pattern list
  aetherpane pattern show hero-centered-cta
  aetherpane pattern build --hero hero-centered-cta --features card-feature-grid --cta-band --theme classic --output page.html
`);
    return;
  }

  const sub = args[0];
  const subArgs = args.slice(1);

  try {
    const compose = require(path.join(SKILL_DIR, 'patterns', 'compose.cjs'));

    switch (sub) {
      case 'list':
        compose.listPatterns();
        break;
      case 'show':
        if (!subArgs[0]) { console.error('Provide pattern id'); process.exit(1); }
        const pattern = compose.loadPattern(subArgs[0]);
        console.log(JSON.stringify(pattern, null, 2));
        break;
      case 'build': {
        const opts = parseArgs(subArgs);
        if (!opts.hero) { console.error('Provide --hero <pattern-id>'); process.exit(1); }
        compose.composePage({
          hero: opts.hero,
          features: opts.features,
          ctaBand: opts['cta-band'] !== undefined,
          theme: opts.theme || 'classic',
          title: opts.title || 'AetherPane Page',
          output: opts.output
        });
        if (opts.output) console.log(`Page generated: ${opts.output}`);
        break;
      }
      default:
        console.error(`Unknown pattern subcommand: ${sub}`);
    }
  } catch (err) {
    console.error(`Pattern error: ${err.message}`);
    process.exit(1);
  }
}

function runGenerate(args) {
  if (!args.length || args[0] === '--help') {
    console.log(`
Usage: aetherpane generate <page-type> [options]

Page types: landing, showcase, dashboard, settings

Options:
  --theme <theme>     Theme (classic|editorial|signal)
  --hero <id>         Hero pattern
  --output <file>     Output file
  --title <string>    Page title

Examples:
  aetherpane generate landing --theme classic --output landing.html
  aetherpane generate dashboard --theme signal --output dashboard.html
`);
    return;
  }

  const pageType = args[0];
  const opts = parseArgs(args.slice(1));
  const theme = opts.theme || 'classic';

  const defaultPatterns = {
    landing: { hero: 'hero-centered-cta', features: 'card-feature-grid', ctaBand: true },
    showcase: { hero: 'hero-split-content', features: 'card-feature-grid', ctaBand: true },
    dashboard: { hero: 'hero-centered-cta', features: 'layout-sidebar-content', ctaBand: false },
    settings: { hero: 'hero-centered-cta', features: 'layout-sidebar-content', ctaBand: false }
  };

  const config = defaultPatterns[pageType] || defaultPatterns.landing;

  try {
    const compose = require(path.join(SKILL_DIR, 'patterns', 'compose.cjs'));
    compose.composePage({
      hero: opts.hero || config.hero,
      features: opts.features || config.features,
      ctaBand: config.ctaBand,
      theme: theme,
      title: opts.title || `AetherPane ${pageType}`,
      output: opts.output
    });
    if (opts.output) console.log(`Generated ${pageType} page: ${opts.output}`);
  } catch (err) {
    console.error(`Generate error: ${err.message}`);
    process.exit(1);
  }
}

function parseArgs(args) {
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        opts[key] = args[i + 1];
        i++;
      } else {
        opts[key] = true;
      }
    }
  }
  return opts;
}

const args = process.argv.slice(2);

if (!args.length || args[0] === '--help' || args[0] === '-h') {
  printHelp();
  process.exit(0);
}

if (args[0] === '--version' || args[0] === '-v') {
  try {
    const skill = fs.readFileSync(path.join(SKILL_DIR, 'SKILL.md'), 'utf8');
    const versionMatch = skill.match(/version:\s*(.+)/);
    console.log(`AetherPane CLI v${versionMatch ? versionMatch[1].trim() : 'unknown'}`);
  } catch {
    console.log('AetherPane CLI v0.3.0');
  }
  process.exit(0);
}

runCommand(args[0], args.slice(1));
