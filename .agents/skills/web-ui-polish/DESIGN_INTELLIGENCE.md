---
name: design-intelligence
version: 1.0.0
description: Aesthetic judgment framework and quality scoring system for AI agents
category: design-intelligence
subcategory: quality-assurance
author: AetherPane Team
---

# Design Intelligence

A framework that teaches AI agents how to make aesthetic judgments, score design quality, and choose the right patterns for each page type.

## 1. Aesthetic Judgment Framework

### 1.1 Visual Hierarchy Score (VHS)

Visual hierarchy measures whether the page guides the reader's eye from most important to least important content.

**Scoring criteria (0-10)**:

| Score | Description |
|-------|-------------|
| 9-10 | Single clear focal point per section. Heading levels are unmistakably different. CTA is obvious. |
| 7-8 | Good hierarchy with minor inconsistencies. Some sections could be tighter. |
| 5-6 | Hierarchy exists but is muddy. Too many elements compete for attention. |
| 3-4 | No clear hierarchy. Everything looks equally important or equally unimportant. |
| 0-2 | Chaotic. No structure, no reading order, no focal point. |

**Automated checks**:

```
VHS scoring logic:
  heading_contrast  = (h1_size - h2_size) / h2_size   -- ideal: 0.3-0.6
  heading_weight    = h1_weight distinct from body      -- ideal: 700 vs 400
  focal_points      = count of primary elements         -- ideal: 1 per section
  cta_clarity       = count of primary buttons          -- ideal: 1 per section cluster
  spacing_tier      = distinct spacing tiers used       -- ideal: 3-5 tiers

  VHS = clamp(
    (heading_contrast_score * 0.3) +
    (heading_weight_score * 0.2) +
    (focal_points_score * 0.25) +
    (cta_clarity_score * 0.15) +
    (spacing_tier_score * 0.1),
    0, 10
  )
```

### 1.2 Breathing Space Analysis (BSA)

Breathing space measures whether content has enough room to feel calm and readable.

**Scoring criteria (0-10)**:

| Score | Description |
|-------|-------------|
| 9-10 | Generous spacing. Content breathes. Clear visual gaps between sections. |
| 7-8 | Good spacing overall, some tight areas. |
| 5-6 | Adequate but cramped in places. Text feels dense. |
| 3-4 | Consistently tight. Elements crowd each other. |
| 0-2 | No breathing room. Everything is crammed together. |

**Automated checks**:

```
BSA scoring logic:
  section_padding   = vertical padding between sections  -- ideal: 76-120px
  card_padding      = internal card padding               -- ideal: 20-24px
  paragraph_spacing = margin between paragraphs           -- ideal: 16-24px
  element_gap       = gap between sibling elements        -- ideal: 14-32px

  BSA = clamp(
    (section_padding_score * 0.35) +
    (card_padding_score * 0.25) +
    (paragraph_spacing_score * 0.2) +
    (element_gap_score * 0.2),
    0, 10
  )
```

### 1.3 Glass Quality Metrics (GQM)

Glass quality measures whether glassmorphism is used effectively and not cheaply.

**Scoring criteria (0-10)**:

| Score | Description |
|-------|-------------|
| 9-10 | Glass used only on top-level shells. Child content is solid and readable. |
| 7-8 | Glass used well, minor overuse on non-essential surfaces. |
| 5-6 | Glass on several cards or panels that would be better solid. |
| 3-4 | Glass everywhere. Nested glass. Muddy contrast. |
| 0-2 | Glass on every element. Unreadable content. Decorative noise. |

**Automated checks**:

```
GQM scoring logic:
  glass_count       = number of .glass elements
  glass_nesting     = instances of glass inside glass
  glass_positions   = glass on topbar/sidebar/panel vs cards
  glass_readability = text contrast inside glass surfaces

  GQM = clamp(
    (glass_appropriateness * 0.4) +
    (no_nesting_score * 0.3) +
    (readability_score * 0.3),
    0, 10
  )

  where glass_appropriateness:
    10 = glass only on shells (topbar, hero-panel, modal, drawer, theme-dock)
     7 = glass on shells + 1-2 premium cards
     4 = glass on most cards and panels
     1 = glass on everything
```

### 1.4 Typography Rhythm Score (TRS)

Typography rhythm measures whether text sizes, weights, and spacing create a clear hierarchy.

**Scoring criteria (0-10)**:

| Score | Description |
|-------|-------------|
| 9-10 | Clear type scale. Distinct heading levels. Readable body text. |
| 7-8 | Good typography with minor inconsistencies. |
| 5-6 | Acceptable but some heading levels look too similar. |
| 3-4 | Weak hierarchy. Headings and body text are hard to distinguish. |
| 0-2 | No typography system. Random sizes and weights. |

**Automated checks**:

```
TRS scoring logic:
  type_scale        = ratio between h1, h2, h3, body    -- ideal: 1.2-1.5 step ratio
  line_height       = body line-height                   -- ideal: 1.6-1.8
  weight_contrast    = heading vs body font-weight        -- ideal: 700 vs 400
  max_line_length   = max-width on text blocks            -- ideal: 55-70ch

  TRS = clamp(
    (type_scale_score * 0.3) +
    (line_height_score * 0.25) +
    (weight_contrast_score * 0.25) +
    (line_length_score * 0.2),
    0, 10
  )
```

### 1.5 Overall Design Score (ODS)

```
ODS = (VHS * 0.30) + (BSA * 0.25) + (GQM * 0.20) + (TRS * 0.25)

Quality tiers:
  9.0-10.0  Exceptional
  7.5-8.9   Production-ready
  6.0-7.4   Acceptable, needs polish
  4.0-5.9   Below standard, requires rework
  0.0-3.9   Unusable, start over
```

## 2. AI Decision Framework

### 2.1 Theme Selection Logic

```
Theme Selection Decision Tree:

What is the primary page goal?
|
|-- Conversion / marketing / sales
|   |-- Brand personality?
|   |   |-- Professional, trustworthy -> classic
|   |   |-- Bold, expressive -> editorial
|   |   |-- Technical, efficient -> signal
|
|-- Data display / dashboard / analytics
|   |-- signal (always)
|
|-- Storytelling / blog / case study
|   |-- editorial (always)
|
|-- Settings / utility / admin
|   |-- signal (default)
|   |-- classic (if brand warmth needed)
|
|-- Product showcase
|   |-- Visual-heavy? -> editorial
|   |-- Technical product? -> signal
|   |-- Premium/lifestyle? -> classic

When in doubt: choose classic.
```

### 2.2 Page Type Selection Logic

```
Page Type Decision Tree:

What is the user building?
|
|-- Marketing a product or service
|   |-- landing
|
|-- Showing a product with visuals
|   |-- showcase
|
|-- Displaying data, metrics, or tools
|   |-- dashboard
|
|-- Grouped controls, forms, preferences
|   |-- settings
|
|-- Showing reusable components
|   |-- component gallery
|
|-- Showing reusable page layouts
|   |-- template gallery
```

### 2.3 Component Selection Logic

```
Component Selection by Section Role:

Section: Hero
  Primary:   page-hero, page-hero-copy
  Support:   hero-grid, hero-panel glass, hero-media
  Content:   eyebrow, h1 (with span accent), lede
  Actions:   hero-actions (button.primary + button.secondary)

Section: Proof / Features
  Primary:   card-row
  Cards:     principle-card
  Content:   mini-label, card-title, supporting paragraph

Section: Story / Explanation
  Primary:   hero-grid or showcase-layout
  Support:   stacked-cards
  Cards:     story-card
  Content:   mini-label, card-title, paragraph

Section: Metrics / Stats
  Primary:   metric-row
  Cards:     metric-card
  Content:   mini-label, large number or label

Section: Dashboard
  Primary:   dashboard-shell
  Nav:       dashboard-nav glass
  Metrics:   metric-row
  Panels:    panel-grid, content-panel

Section: Settings
  Primary:   settings-layout
  Support:   stacked-cards
  Panels:    settings-panel
  Groups:    settings-group
  Controls:  toggle, segmented-control

Section: CTA / Closing
  Primary:   cta-band
  Content:   h2, supporting text
  Action:    button.primary
```

## 3. Common Design Mistakes and Fixes

### 3.1 Glass Overuse

**Symptom**: Every card, panel, and section uses `.glass`.

**Diagnosis**: GQM score below 5.

**Fix**:
1. Remove `.glass` from all cards and content panels
2. Keep `.glass` only on: topbar, hero-panel, dashboard-nav, modal-shell, drawer-shell, theme-dock
3. Use solid backgrounds (`color-surface-card`, `color-surface-panel`) for content surfaces
4. Ensure child elements inside glass shells are readable

**Before**:
```html
<section class="section">
  <div class="glass">
    <div class="glass">
      <div class="glass">
        <h2>Everything is floating</h2>
      </div>
    </div>
  </div>
</section>
```

**After**:
```html
<section class="section hero-grid">
  <div class="hero-media rise">
    <div class="hero-panel glass">
      <article class="stage-card spotlight">
        <p>Module</p>
        <strong>Glass on the parent shell only.</strong>
      </article>
    </div>
  </div>
  <div class="stacked-cards rise rise-delay">
    <article class="story-card">
      <p class="mini-label">Readability</p>
      <p class="card-title">Internal cards stay solid and calm.</p>
    </article>
  </div>
</section>
```

### 3.2 Hero-Only Delivery

**Symptom**: Only the hero section is polished. The rest of the page is empty or rough.

**Diagnosis**: Page has fewer than 3 sections.

**Fix**:
1. Add a proof/features section after the hero
2. Add a support/explanation section
3. End with a cta-band
4. Target: at least 3 sections for a complete page

### 3.3 Too Many CTAs

**Symptom**: Three or more equally styled primary buttons in one view.

**Diagnosis**: More than 1 `button.primary` per section cluster.

**Fix**:
1. Keep one `button.primary` as the main action
2. Convert others to `button.secondary`
3. Remove any CTAs that are not essential

### 3.4 Flat Visual Weight

**Symptom**: Every section has the same layout density and card treatment.

**Diagnosis**: VHS score below 6.

**Fix**:
1. Alternate section densities (grid section followed by single-focus section)
2. Use different card types for different content roles
3. Add one premium element per section (spotlight card, display-frame, etc.)
4. Vary spacing between sections

### 3.5 Weak Heading Rhythm

**Symptom**: h1, h2, and body text feel too similar in size.

**Diagnosis**: TRS score below 6.

**Fix**:
1. Use `page-hero-copy h1` for the page promise (clamp(3.4rem, 8vw, 6.4rem))
2. Use `section-heading h2` for section titles (clamp(2.3rem, 5vw, 4.1rem))
3. Use `card-title` for card headings (1.18rem)
4. Use `lede` for page-intro support copy
5. Ensure font-weight contrast: headings at 700, body at 400

### 3.6 Media Without Purpose

**Symptom**: Decorative images or screenshots that do not explain anything.

**Fix**:
1. Each media block should prove a feature or anchor a section
2. Use display-frame for product screenshots
3. Use animation-demo stages for interaction demonstrations
4. Remove any media that does not serve the narrative

### 3.7 Motion as Decoration

**Symptom**: Bouncy, unrelated animations on elements.

**Fix**:
1. Use `.rise` for block-level reveal entrances
2. Use `.rise-delay` for staggered sequences
3. Use hover transforms (`translateY(-2px)`) for interactive elements
4. Respect `prefers-reduced-motion`

### 3.8 Poor Responsive Collapse

**Symptom**: Layout breaks or stays multi-column on mobile.

**Fix**:
1. Respect system breakpoints: 1100px (tablet) and 720px (mobile)
2. Collapse grids to single column at 1100px
3. Narrow page shell and reduce section padding at 720px
4. Test hero readability on mobile

## 4. Quality Scoring System

### 4.1 Automated Scoring Script

The `design-critique.js` script implements the scoring system. It reads an HTML file and produces a structured report.

**Usage**:
```bash
node scripts/design-critique.js path/to/page.html
```

**Output format**:
```json
{
  "file": "path/to/page.html",
  "scores": {
    "visual_hierarchy": 8.2,
    "breathing_space": 7.8,
    "glass_quality": 9.0,
    "typography": 8.5,
    "overall": 8.4
  },
  "tier": "production-ready",
  "details": {
    "heading_contrast": "strong",
    "glass_usage": "appropriate",
    "cta_count": 2,
    "section_count": 4
  },
  "suggestions": []
}
```

### 4.2 Score Interpretation for AI Agents

```
if ODS >= 9.0:
  report: "Exceptional. Ship it."
  action: none

if ODS >= 7.5:
  report: "Production-ready. Minor polish optional."
  action: review suggestions, apply if trivial

if ODS >= 6.0:
  report: "Acceptable but needs polish."
  action: review each sub-score, fix lowest first

if ODS >= 4.0:
  report: "Below standard. Rework required."
  action: identify worst sub-scores, rebuild those sections

if ODS < 4.0:
  report: "Unusable. Start over."
  action: discard output, start from page pattern
```

## 5. AI Agent Workflow

### 5.1 Standard Polish Workflow

```
Step 1: Analyze
  - Read the target page or requirements
  - Identify page type (landing, showcase, dashboard, settings)
  - Select appropriate theme (classic, editorial, signal)
  - Reference matching pattern from resources/

Step 2: Structure
  - Fix section order (hero, proof, support, CTA)
  - Ensure semantic HTML (main, section, article)
  - Add correct AetherPane class names
  - Establish heading hierarchy

Step 3: Surface
  - Apply .glass only to top-level shells
  - Use solid surfaces for content cards
  - Ensure consistent border, radius, shadow tokens

Step 4: Spacing
  - Apply section rhythm (--space-section)
  - Set card padding (20-24px)
  - Set element gaps (--space-gap-md, --space-gap-lg)
  - Verify breathing room

Step 5: Typography
  - Set hero title (h1 with accent span)
  - Set section headings (h2)
  - Set body text (lede for intros)
  - Verify line-height and max-width

Step 6: Motion
  - Add .rise to major blocks
  - Add .rise-delay for stagger
  - Keep hover effects subtle
  - Respect prefers-reduced-motion

Step 7: Verify
  - Run design-critique.js
  - Target ODS >= 7.5
  - Fix any sub-score below 7.0
```

### 5.2 Quick Polish Checklist

```
Before delivering output:
  [ ] Page has 3+ sections (not hero-only)
  [ ] One clear focal point per section
  [ ] One primary CTA per section cluster
  [ ] Glass on shells only, not on every card
  [ ] Headings are unmistakably different sizes
  [ ] Body text line-height is 1.6+
  [ ] Section spacing is generous (76px+)
  [ ] Motion is subtle (rise, rise-delay only)
  [ ] Responsive at 1100px and 720px
  [ ] data-theme attribute is set
  [ ] Semantic HTML tags used (main, section, article)
```

## 6. Integration with Existing System

### 6.1 CSS Classes

This framework references the following AetherPane classes from `src/styles.css`:

**Layout**: `.section`, `.page-hero`, `.hero-grid`, `.showcase-layout`, `.dashboard-shell`, `.settings-layout`, `.component-showcase`

**Surfaces**: `.glass`, `.hero-panel`, `.story-card`, `.principle-card`, `.stage-card`, `.content-panel`, `.settings-panel`

**Content**: `.eyebrow`, `.mini-label`, `.lede`, `.card-title`, `.panel-caption`

**Motion**: `.rise`, `.rise-delay`

**Actions**: `.button.primary`, `.button.secondary`, `.toggle`, `.segmented-control`

### 6.2 Design Tokens

This framework references tokens from `src/tokens.css`:

**Spacing**: `--space-section` (76px), `--space-section-mobile` (60px), `--space-gap-lg` (32px), `--space-gap-md` (18px), `--space-gap-sm` (14px)

**Typography**: `--font-body`, `--font-display`, `--font-accent`, `--color-text-primary`, `--color-text-muted`

**Motion**: `--motion-ease-standard` (320ms), `--motion-duration-enter` (760ms)

**Radius**: `--radius-xl` (32px), `--radius-lg` (24px), `--radius-md` (18px)

### 6.3 Machine-Readable Configurations

The scoring thresholds and design rules are also available as JSON:
- `resources/style-guide.json` - Spacing, typography, glass, and animation rules
- `resources/tokens.json` - All design tokens in JSON format
- `resources/theme-personalities.json` - Theme selection guide
- `resources/checklist.json` - Structured validation checklist

### 6.4 Validation Scripts

Automated checks are available in `scripts/`:
- `validate-html.js` - HTML structure validation
- `validate-a11y.js` - Accessibility checks
- `validate-tokens.js` - Design token usage validation
- `design-critique.js` - Design quality scoring (implements this framework)
