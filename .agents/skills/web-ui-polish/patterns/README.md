# AetherPane Pattern Library

Reusable, composable design patterns for building premium web pages with AetherPane.

## What Are Patterns?

Patterns are self-contained JSON files that describe a visual section of a page. Each pattern includes:

- **HTML template** with `{{variable}}` placeholders for customization
- **Variable definitions** with types and sensible defaults
- **Theme compatibility** (classic, editorial, signal)
- **Usage guidance** for when to use or avoid the pattern
- **Quality scores** reflecting polish and reliability
- **Variants** for common modifications

Patterns are not copy-paste snippets. They are structured building blocks that the composition engine assembles into complete, consistent pages.

## Pattern Format

```json
{
  "id": "unique-kebab-id",
  "name": "Human-readable name",
  "category": "hero | card | layout",
  "description": "When and why to use this pattern",
  "themes": ["classic", "editorial", "signal"],
  "structure": {
    "html": "<section>...{{variable}}...</section>",
    "variables": {
      "variable_name": { "type": "string", "default": "value" }
    }
  },
  "variants": [],
  "usage": {
    "best_for": ["use cases"],
    "avoid_when": ["anti-use-cases"]
  },
  "quality_score": 9.0
}
```

## Available Patterns

### Hero Patterns

| ID | Name | Description | Score |
|---|---|---|---|
| `hero-centered-cta` | Centered CTA Hero | Centered headline with dual CTA buttons | 9.0 |
| `hero-split-content` | Split Content Hero | Two-column hero with glass panel and story cards | 8.8 |
| `hero-video-background` | Video Background Hero | Full-height hero with media background and glass overlay | 8.5 |

### Card Patterns

| ID | Name | Description | Score |
|---|---|---|---|
| `card-feature-grid` | Feature Grid Cards | 3-column principle-card grid with staggered reveal | 9.0 |
| `card-testimonial` | Testimonial Cards | Two-column layout with pull quote and author cards | 8.5 |
| `card-pricing-table` | Pricing Table Cards | 3-tier pricing grid with spotlight on recommended plan | 8.7 |

### Layout Patterns

| ID | Name | Description | Score |
|---|---|---|---|
| `layout-sidebar-content` | Sidebar Content | Dashboard shell with glass nav and panel grid | 8.8 |
| `layout-masonry-grid` | Masonry Grid | Mixed-size card layout with varying heights | 8.3 |
| `layout-bento-box` | Bento Box Grid | Grid with one spotlight panel and supporting panels | 8.6 |

## Using compose.cjs

The composition engine is a CLI tool that combines patterns into complete HTML pages.

### List Patterns

```bash
node skills/web-ui-polish/patterns/compose.cjs list
```

### Show Pattern Details

```bash
node skills/web-ui-polish/patterns/compose.cjs show hero-centered-cta
```

### Build a Page

```bash
node skills/web-ui-polish/patterns/compose.cjs build \
  --hero hero-centered-cta \
  --features card-feature-grid \
  --cta-band \
  --theme classic \
  --title "My Page" \
  --output output.html
```

### Build Options

| Option | Description |
|---|---|
| `--hero <id>` | Hero pattern to include |
| `--features <id>` | Card/feature pattern to include |
| `--cta-band` | Add a standard CTA band before the footer |
| `--theme <theme>` | Theme: `classic`, `editorial`, or `signal` |
| `--title <string>` | Page title and topbar brand text |
| `--output <file>` | Output file path (prints to stdout if omitted) |

### Programmatic Usage

```js
const { composePage, loadPattern, listPatterns } = require("./compose.cjs");

const patterns = listPatterns();
const result = composePage({
  hero: "hero-centered-cta",
  features: "card-feature-grid",
  ctaBand: true,
  theme: "classic",
  title: "My Page",
  output: "page.html",
});
```

## Adding New Patterns

1. Choose the correct category directory: `hero-patterns/`, `card-patterns/`, or `layout-patterns/`
2. Create a JSON file following the pattern format above
3. Use only AetherPane CSS classes from the approved set
4. Add an entry to `pattern-registry.json` with id, file path, category, and quality score
5. Test with `compose.cjs show <new-id>` and `compose.cjs build --hero <new-id>`

### Rules for New Patterns

- Use `.glass` only on top-level shell surfaces (topbars, sidebars, modals, hero panels)
- Use `.rise` and `.rise-delay` for subtle motion, never custom animation classes
- Every pattern must be responsive and complete (not a partial fragment)
- Prefer existing classes over inventing new ones
- Quality scores range from 1.0 to 10.0; new patterns should target 8.0+

## Example Compositions

### SaaS Landing Page

```bash
node compose.cjs build \
  --hero hero-centered-cta \
  --features card-feature-grid \
  --cta-band \
  --theme classic \
  --title "SaaS Product" \
  --output landing.html
```

### Product Showcase

```bash
node compose.cjs build \
  --hero hero-split-content \
  --features card-pricing-table \
  --cta-band \
  --theme editorial \
  --title "Product Showcase" \
  --output showcase.html
```

### Dashboard Overview

```bash
node compose.cjs build \
  --hero hero-centered-cta \
  --features layout-sidebar-content \
  --theme signal \
  --title "Dashboard" \
  --output dashboard.html
```

### Capability Overview

```bash
node compose.cjs build \
  --hero hero-centered-cta \
  --features layout-bento-box \
  --cta-band \
  --theme classic \
  --title "Capabilities" \
  --output capabilities.html
```
