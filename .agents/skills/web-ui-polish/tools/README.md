# AetherPane CLI

Unified command-line interface for the AetherPane Premium UI Design System.

## Installation

```bash
# From the project root
node skills/web-ui-polish/tools/cli.cjs <command>

# Or create an alias
alias aetherpane="node skills/web-ui-polish/tools/cli.cjs"
```

## Commands

### critique - Design Critique

Run design quality analysis on HTML files.

```bash
# Single file
aetherpane critique examples/landing-classic.html

# Directory (batch mode)
aetherpane critique examples/

# JSON output
aetherpane critique examples/landing-classic.html --json

# Compare against previous score
aetherpane critique page.html --compare previous-score.json
```

### track - Evolution Tracking

Track design improvements over time.

```bash
# Initialize a project
aetherpane track init my-project

# Save a version
aetherpane track save my-project v1 "Initial version" --file page.html

# View history
aetherpane track history my-project

# Generate report
aetherpane track report my-project

# Compare two versions
aetherpane track diff v1.html v2.html
```

### collab - Collaboration Tools

Multi-agent collaboration management.

```bash
# List available agents
aetherpane collab list

# Show agent details
aetherpane collab show claude-code

# Find best agent for task
aetherpane collab allocate --requirements semantic_html,copywriting

# Optimize workflow
aetherpane collab optimize workflow.json
```

### pattern - Pattern Management

Design pattern library operations.

```bash
# List available patterns
aetherpane pattern list

# Show pattern details
aetherpane pattern show hero-centered-cta

# Build page from patterns
aetherpane pattern build \
  --hero hero-centered-cta \
  --features card-feature-grid \
  --cta-band \
  --theme classic \
  --output page.html
```

### generate - Page Generation

Quick page generation from type presets.

```bash
# Generate landing page
aetherpane generate landing --theme classic --output landing.html

# Generate dashboard
aetherpane generate dashboard --theme signal --output dashboard.html

# Generate showcase
aetherpane generate showcase --theme editorial --output showcase.html

# Generate settings
aetherpane generate settings --theme signal --output settings.html
```

## Global Options

| Option | Description |
|--------|-------------|
| `--help` | Show help message |
| `--version` | Show version |
| `--json` | Output raw JSON |
| `--theme` | Theme (classic/editorial/signal) |
| `--output` | Output file path |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Error (file not found, validation failed, etc.) |

## Programmatic Usage

```javascript
const cli = require('./tools/cli.cjs');
```
