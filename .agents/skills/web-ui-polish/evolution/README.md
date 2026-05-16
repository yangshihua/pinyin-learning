# Design Evolution Tracker

Tracks design quality across versions of AetherPane pages. Records snapshots, runs critiques, and identifies improvement patterns over time.

## Files

| File | Purpose |
|---|---|
| `tracker.cjs` | CLI for init, save, history, and report |
| `diff-analyzer.cjs` | Compares two HTML snapshots |
| `pattern-extractor.cjs` | Extracts recurring improvement patterns |
| `reports/` | Stored project snapshots and manifests |

## tracker.cjs

### Commands

```bash
# Create a new project
node tracker.cjs init <project-name>

# Save a version snapshot
node tracker.cjs save <project-name> <version> <description>
node tracker.cjs save landing-page v1 "Initial version"
node tracker.cjs save landing-page v2 "Added glass nav" --file ./dist/index.html

# View version history
node tracker.cjs history <project-name>

# Generate full evolution report
node tracker.cjs report <project-name>
```

### Data Format

Each project has a `reports/<project-name>/manifest.json`:

```json
{
  "project": "landing-page",
  "created": "2026-04-08T10:00:00Z",
  "versions": [
    {
      "version": "v1",
      "timestamp": "2026-04-08T10:00:00Z",
      "file": "reports/landing-page/v1.html",
      "description": "Initial version",
      "score": 6.5,
      "breakdown": {
        "visual_hierarchy": 6,
        "breathing_space": 7,
        "glass_quality": 7,
        "typography": 6
      },
      "changes": []
    }
  ]
}
```

## diff-analyzer.cjs

Compares two HTML files and reports structural differences.

```bash
# Human-readable diff
node diff-analyzer.cjs v1.html v2.html

# JSON output
node diff-analyzer.cjs v1.html v2.html --json
```

Output includes tag changes, class changes, section changes, and estimated score impact across dimensions.

## pattern-extractor.cjs

Reads a project manifest and identifies recurring improvement patterns.

```bash
# Extract patterns
node pattern-extractor.cjs <project-name>

# JSON output
node pattern-extractor.cjs <project-name> --json
```

Returns detected patterns with frequency, average score impact, and affected dimensions, plus actionable insights.

## Programmatic Usage

```js
const { initProject, saveVersion, showHistory, generateReport } = require('./tracker.cjs');
const { analyzeDiff } = require('./diff-analyzer.cjs');
const { extractPatterns } = require('./pattern-extractor.cjs');
```
