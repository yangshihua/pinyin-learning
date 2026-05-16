# AetherPane Design Critique System

Automated design quality analysis for AetherPane pages. Scores HTML against four dimensions — visual hierarchy, breathing space, glass quality, and typography — and produces structured reports with actionable fixes.

## What It Does

- **Scores** any HTML file on a 0-10 scale across 4 weighted dimensions
- **Detects issues** with severity levels (error, warning, info) and specific code fixes
- **Generates reports** in HTML, Markdown, or JSON format
- **Visualizes issues** as annotated HTML with hover tooltips
- **Batch critiques** entire directories of HTML files
- **Compares scores** against previous runs to track improvements

## Files

| File | Purpose |
|------|---------|
| `critique-engine.cjs` | Core scoring engine with issue detection and recommendations |
| `report-generator.cjs` | Generates HTML, Markdown, or JSON reports from critique data |
| `visualizer.cjs` | Produces annotated HTML with highlighted issues and hover tooltips |
| `templates/html-report.html` | HTML report template with AetherPane styling |
| `templates/markdown-report.md` | Markdown report template |
| `README.md` | This documentation |

## CLI Usage

### Critique a single file

```bash
node skills/web-ui-polish/critique/critique-engine.cjs path/to/page.html
```

### Critique with JSON output

```bash
node skills/web-ui-polish/critique/critique-engine.cjs path/to/page.html --json
```

### Batch critique a directory

```bash
node skills/web-ui-polish/critique/critique-engine.cjs skills/web-ui-polish/examples/
```

### Compare against a previous score

```bash
node skills/web-ui-polish/critique/critique-engine.cjs page.html --compare previous-scores.json --json > current-scores.json
```

### Generate an HTML report

```bash
# First run critique with --json, then generate report
node skills/web-ui-polish/critique/critique-engine.cjs page.html --json > critique.json
node skills/web-ui-polish/critique/report-generator.cjs critique.json --format html --output report.html
```

### Generate a Markdown report

```bash
node skills/web-ui-polish/critique/report-generator.cjs critique.json --format markdown --output report.md
```

### Visualize issues on the page

```bash
node skills/web-ui-polish/critique/visualizer.cjs page.html critique.json annotated-page.html
```

## Programmatic Usage

```js
const { critiqueFile, critiqueDirectory } = require('./critique-engine.cjs');
const { generateReport } = require('./report-generator.cjs');
const { visualizeIssues } = require('./visualizer.cjs');

// Critique a file
const result = critiqueFile('path/to/page.html');
console.log(result.scores.overall);  // e.g. 7.8
console.log(result.grade);           // e.g. 'B'
console.log(result.tier);            // e.g. 'production-ready'

// Access issues per dimension
result.dimensions.visual_hierarchy.issues.forEach(issue => {
  console.log(`[${issue.severity}] ${issue.location}: ${issue.problem}`);
  console.log(`  Fix: ${issue.code_fix}`);
});

// Generate reports
const htmlReport = generateReport(result, { format: 'html' });
const mdReport = generateReport(result, { format: 'markdown' });
generateReport(result, { format: 'html', output: 'report.html' });

// Batch critique
const batch = critiqueDirectory('skills/web-ui-polish/examples/');
console.log(`Average: ${batch.summary.average_score}`);

// Visualize
visualizeIssues('page.html', result, 'annotated.html');
```

## Scoring Dimensions

### Visual Hierarchy (weight: 0.30)

Checks heading structure, section rhythm, CTA count, eyebrow/lede usage, and spotlight emphasis.

### Breathing Space (weight: 0.25)

Checks section spacing classes, gap utilities, text max-width, and padding values.

### Glass Quality (weight: 0.20)

Checks glass surface count, nesting, and whether glass is applied to appropriate shells vs. content cards.

### Typography (weight: 0.25)

Checks font token usage, fluid clamp() sizing, line-height values, and content type classes.

### Overall Score

```
overall = vh × 0.30 + bs × 0.25 + gq × 0.20 + ty × 0.25
```

### Grades

| Score | Grade | Tier |
|-------|-------|------|
| 9.5+  | A+    | Exceptional |
| 9.0+  | A     | Exceptional |
| 8.5+  | B+    | Production-ready |
| 7.5+  | B     | Production-ready |
| 6.5+  | C+    | Acceptable |
| 6.0+  | C     | Acceptable |
| 5.0+  | D     | Below standard |
| < 5.0 | F     | Unusable |

## Output Format

### JSON Structure

```json
{
  "file": "path/to/page.html",
  "file_name": "page.html",
  "timestamp": "2026-04-08T12:00:00.000Z",
  "scores": {
    "visual_hierarchy": 8.0,
    "breathing_space": 7.5,
    "glass_quality": 9.0,
    "typography": 6.5,
    "overall": 7.7
  },
  "grade": "B",
  "tier": "production-ready",
  "dimensions": {
    "visual_hierarchy": {
      "score": 8.0,
      "issues": [
        {
          "severity": "warning",
          "location": "page sections",
          "problem": "No h2 elements found",
          "suggestion": "Add h2 headings to label each section",
          "code_fix": "<h2>Section Title</h2>"
        }
      ]
    }
  },
  "recommendations": [
    "Weakest dimension: Typography (6.5/10) — prioritize improvements here.",
    "Score is production-ready. Address remaining warnings for a premium finish."
  ]
}
```

## Integration with Other Tools

- **design-critique.cjs** (scripts/): The critique engine extends the basic scoring from the existing script with detailed issue detection, code fixes, and recommendations.
- **validate-tokens.cjs** / **validate-a11y.cjs**: Run these alongside the critique system for comprehensive page validation.
- **qa:release** workflow: Integrate the critique engine into CI to enforce quality thresholds (exit code 0 if overall >= 7.0).

## Exit Codes

- `0` — Overall score >= 7.0 (production-ready threshold)
- `1` — Overall score < 7.0
