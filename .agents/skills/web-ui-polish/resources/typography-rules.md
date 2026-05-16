# Typography Rules

Typography is one of the main reasons AetherPane feels premium. The system depends on calm contrast, clear hierarchy, and controlled line length.

## Core Typography Principles

- Headlines should feel clearly different from section titles
- Section titles should feel clearly different from body text
- Support text should remain calm and secondary
- Copy should stay concise
- Dense explanation should be broken into sections, not compressed into one paragraph

## Typography Variables

- `--font-body`
- `--font-display`
- `--font-accent`
- `--accent-font-style`
- `--color-text-primary`
- `--color-text-muted`

## Theme Font Behavior

### Classic

- `--font-body`: Manrope
- `--font-display`: Manrope
- `--font-accent`: Instrument Serif
- Accent span styling is italic

Best for:

- premium product marketing
- balanced launch pages
- polished system demos

### Editorial

- `--font-display`: Fraunces
- `--font-accent`: Fraunces
- Accent span styling is not italic

Best for:

- narrative case studies
- editorial launch pages
- curation-heavy showcases

### Signal

- `--font-body`: Space Grotesk
- `--font-display`: Space Grotesk
- `--font-accent`: Space Grotesk

Best for:

- product dashboards
- SaaS shells
- denser utility pages

## Heading Levels

### Page headline: `h1`

Use for:

- the main page promise
- one strong statement at the top of the route

Current styling behavior:

- large scale via `clamp(3.4rem, 8vw, 6.4rem)`
- tighter line-height
- negative tracking
- optional accent line via nested `span`

### Section title: `h2`

Use for:

- major section jobs
- statement headings inside section intros
- CTA band messages

Current styling behavior:

- `clamp(2.3rem, 5vw, 4.1rem)`
- display font family
- clear but calmer than `h1`

### Card title: `.card-title`

Use for:

- story cards
- principle cards
- metrics with title-like emphasis
- modal titles
- drawer titles

Current styling behavior:

- medium-large readable emphasis
- works inside repeatable cards and panels

### Support labels: `.eyebrow` and `.mini-label`

Use for:

- section context
- card metadata
- shell labels
- utility captions

Do not use for:

- primary page messaging
- long sentences

## Body Copy Rules

- `p.lede` is for the hero support paragraph
- `section-heading p` is for short explanatory copy below an `h2`
- `story-card p` is for small support blocks, not essays
- Muted text should still remain readable and purposeful

## Line Length Rules

- Keep body copy to readable widths
- Avoid extremely wide body paragraphs in large screens
- Use multiple support cards instead of one giant text block

## Example 1: Landing Hero Typography

```html
<div class="page-hero-copy">
  <p class="eyebrow">Landing / Marketing</p>
  <h1>
    Premium pages begin with
    <span>clear narrative rhythm</span>
  </h1>
  <p class="lede">
    Use one dominant message, one supporting paragraph, and one primary action.
  </p>
</div>
```

Why it works:

- `eyebrow` provides context
- `h1` carries the page promise
- `span` adds controlled premium contrast
- `lede` stays short and readable

## Example 2: Section Heading Typography

```html
<div class="section-heading rise">
  <p class="eyebrow">Showcase sequence</p>
  <h2>Each section carries one visual argument.</h2>
  <p>
    The page remains readable because every module pairs one short explanation
    with one framed visual moment.
  </p>
</div>
```

Why it works:

- Clear step-down from page headline to section headline
- Support copy stays subordinate

## Example 3: Card Typography

```html
<article class="story-card">
  <p class="mini-label">Grouping</p>
  <p class="card-title">Settings pages stay premium when sections are obvious.</p>
  <p>Use support copy to explain the section without repeating the title.</p>
</article>
```

Why it works:

- `mini-label` adds metadata without stealing attention
- `card-title` carries the idea cleanly

## Example 4: Metric Typography

```html
<article class="metric-card">
  <span>Pattern consistency</span>
  <strong>91%</strong>
</article>
```

Why it works:

- The small label stays muted
- The value is the focal typographic element

## Example 5: Modal Typography

```html
<article class="modal-shell glass" aria-label="Modal preview">
  <p class="mini-label">Modal preview</p>
  <p class="card-title">Confirm a controlled system update.</p>
  <p>Review the component tokens, then publish the change once checks pass.</p>
</article>
```

Why it works:

- Utility labels and modal titles follow the same family as cards
- The modal does not invent a separate type system

## Avoid

- weak hierarchy
- over-emphasized copy
- too many text sizes without purpose
- very long muted paragraphs
- multiple italic or accent treatments in one heading
- all-uppercase long lines

## Practical Type Checklist

- Is there only one `h1` per route-level page?
- Does each `h2` describe the section job?
- Is the support text short enough to be scanned?
- Does the accent line improve rhythm instead of feeling decorative?
- Would the page still read clearly in the `signal` theme where typography is sharper?
