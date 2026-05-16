# Motion Recipes

Motion in AetherPane should support continuity, not spectacle. The system already includes a restrained reveal language. Reuse it instead of inventing page-specific animation logic.

## Existing Motion Classes

- `.rise`
  Base entrance reveal
- `.rise-delay`
  Delayed reveal for a paired or sequenced block

## Existing Motion Variables

- `--motion-ease-standard`
- `--motion-duration-enter`
- `--motion-duration-interactive`

## How The Current Motion Works

- `rise-in` animates opacity and `translateY`
- `rise` uses `--motion-duration-enter`
- Hover states on buttons and toggles use small transform shifts
- Reduced-motion users get near-instant motion via the `prefers-reduced-motion` media query

## Motion Rules

- Animate section groups, not every child element
- Use the same easing curve across interaction families
- Keep entrance motion subtle enough that static screenshots still feel strong
- Never use motion to explain weak structure
- Turn motion down further in settings, forms, and utility-heavy screens

## When Not To Add Motion

- Dense settings screens
- Long forms
- Table-heavy views
- When the page already has many moving media elements
- When the user explicitly requests minimal or static UI

## Recipe 1: Hero Reveal

```html
<section class="page-hero section">
  <div class="page-hero-copy rise">
    <p class="eyebrow">Landing / Marketing</p>
    <h1>
      Premium pages begin with
      <span>clear narrative rhythm</span>
    </h1>
    <p class="lede">Use one calm entrance rather than multiple competing effects.</p>
    <div class="hero-actions">
      <a class="button primary" href="#/showcase">Continue to showcase</a>
      <a class="button secondary" href="#/templates">Review templates</a>
    </div>
  </div>
</section>
```

Use when:

- The hero is the first focal point on the page

## Recipe 2: Paired Reveal Columns

```html
<section class="section component-showcase">
  <div class="component-column rise">
    <article class="story-card">
      <p class="mini-label">Primary block</p>
      <p class="card-title">Reveal the first column immediately.</p>
    </article>
  </div>
  <div class="component-column rise rise-delay">
    <article class="story-card">
      <p class="mini-label">Secondary block</p>
      <p class="card-title">Delay the support column slightly.</p>
    </article>
  </div>
</section>
```

Use when:

- Two columns should enter as one family but not at the exact same moment

## Recipe 3: Card Row Stagger

```html
<section class="section card-row">
  <article class="principle-card rise" style="animation-delay: 0ms;">
    <span>Card 1</span>
    <p class="card-title">Start the sequence.</p>
    <p>Use small timing offsets only when they help reading order.</p>
  </article>
  <article class="principle-card rise" style="animation-delay: 90ms;">
    <span>Card 2</span>
    <p class="card-title">Continue calmly.</p>
    <p>Keep the offsets restrained and consistent.</p>
  </article>
  <article class="principle-card rise" style="animation-delay: 180ms;">
    <span>Card 3</span>
    <p class="card-title">Finish the sequence.</p>
    <p>A small stagger is enough to imply premium care.</p>
  </article>
</section>
```

Use when:

- Cards carry equal weight
- The sequence supports reading order

## Recipe 4: Hover Feedback

```html
<div class="hero-actions">
  <button class="button primary" type="button">Primary action</button>
  <button class="button secondary" type="button">Secondary action</button>
</div>
```

What already happens:

- Buttons lift slightly on hover
- The motion remains small and utility-friendly

Use when:

- Users need tactile confidence, not spectacle

## Recipe 5: Utility Motion

```html
<div class="toggle-row">
  <div>
    <p class="mini-label">Workspace</p>
    <p class="card-title">Expanded shell labels</p>
  </div>
  <button class="toggle active" type="button" aria-pressed="true">
    <span></span>
  </button>
</div>
```

What already happens:

- The toggle knob transitions with `--motion-ease-standard`
- The interaction is quiet and precise

## Reduced Motion Rule

The current system already disables meaningful animation under `prefers-reduced-motion`. Do not add custom animation that bypasses that behavior.

## Motion Review Checklist

- Does the motion reinforce section order?
- Is the same easing curve reused?
- Is the page still strong when screenshots are static?
- Could a reduced-motion user still understand the page perfectly?
