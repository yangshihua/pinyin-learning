# Surface Rules

Surface language is where AetherPane either feels premium or starts to look cheap. The right move is almost always restraint.

## Core Surface Principle

- Structure first
- Solid reading surfaces by default
- Glass only when elevation matters
- One surface family across the whole page

## When To Use `.glass`

Appropriate uses:

- topbar
- sidebar
- floating shell
- hero foreground panel
- modal
- drawer
- theme dock
- selected premium card
- framed media support panel

Do not use `.glass` by default for:

- body content areas
- dense data areas
- long forms
- table-heavy regions
- every repeated card in a grid
- nested cards inside an already glass parent

## Surface Layers In The Current System

### Base page

The page background uses:

- `--color-bg-page`
- `--page-orb-a`
- `--page-orb-b`
- `--page-gradient-top`
- `--page-gradient-bottom`

This should do the atmosphere work before any card styling is added.

### Standard cards

Use:

- `story-card`
- `principle-card`
- `metric-card`
- `content-panel`
- `settings-group`

These are the primary reading surfaces for most repeated content.

### Elevated shells

Use:

- `glass`
- `hero-panel`
- `modal-shell`
- `drawer-shell`
- `dashboard-nav`

These should feel lifted above the base layout.

## Available Surface Variables

- `--color-surface-glass-start`
- `--color-surface-glass-end`
- `--color-surface-card`
- `--color-surface-panel`
- `--color-line-soft`
- `--color-line-strong`
- `--shadow-soft`
- `--shadow-strong`
- `--radius-xl`
- `--radius-lg`
- `--radius-md`
- `--spotlight-surface`
- `--success-panel-start`
- `--success-panel-end`

## Correct Usage Example 1: Top-Level Glass Shell

```html
<div class="hero-panel glass">
  <div class="panel-caption">
    <span class="caption-dot"></span>
    Landing structure
  </div>
  <div class="stage-grid">
    <article class="stage-card spotlight">
      <p>Module 1</p>
      <strong>Use glass on the parent shell only.</strong>
    </article>
    <article class="stage-card">
      <p>Module 2</p>
      <strong>Let internal cards remain solid and readable.</strong>
    </article>
  </div>
</div>
```

Why it works:

- The shell reads as elevated
- The child cards stay readable and stable
- There is one clear premium layer

## Correct Usage Example 2: Utility Navigation

```html
<nav class="dashboard-nav glass" aria-label="Workspace">
  <p class="mini-label">Workspace</p>
  <ul>
    <li class="active">Overview</li>
    <li>Deployments</li>
    <li>Insights</li>
    <li>Activity</li>
  </ul>
</nav>
```

Why it works:

- The shell benefits from elevation
- The child list items still have simple readable surfaces

## Wrong Usage Example 1: Glass Flood

```html
<div class="glass">
  <article class="story-card glass">
    <div class="glass">
      <p class="card-title">Too many elevated layers</p>
    </div>
  </article>
</div>
```

Why it fails:

- Every layer tries to be special
- Borders, blur, and shadow stack into noise
- Readability drops quickly

## Wrong Usage Example 2: Glass In Dense Forms

```html
<section class="glass">
  <label class="form-field">
    <span class="field-label">Workspace name</span>
    <input class="field-input glass" type="text" />
  </label>
</section>
```

Why it fails:

- Dense form inputs should feel precise, not atmospheric
- Blur on input surfaces lowers clarity and focus

## Border And Shadow Rules

- Use soft borders to define card edges
- Use shadows to separate layers, not to overpower them
- Heavier shadows belong to framed media or floating surfaces
- Reading cards should generally stay on the softer end of the shadow scale

## Radius Rules

- `--radius-xl`
  Use for major shells, large framed media, template cards, and hero panels
- `--radius-lg`
  Use for story cards, principle cards, metrics, drawers, toasts, and panels
- `--radius-md`
  Use for smaller controls, steps, and utility blocks

## Surface Pairing Rules

Preferred pairings:

- glass shell + solid cards
- solid section + spotlight first card
- framed media + glass support panel
- dashboard nav glass + standard content panels

Avoid pairings like:

- glass shell + glass cards + glass inner controls
- spotlight card inside an already noisy background without contrast support

## Theme Differences

- `classic`
  Soft neutral surfaces and liquid-glass mood
- `editorial`
  Warmer surfaces, softer cream edges, more publication-like calm
- `signal`
  Sharper, cooler product surfaces with crisper utility contrast

## Practical Checklist

- Does this surface clarify hierarchy?
- Would a solid card work better here?
- Is the blur reserved for one meaningful layer?
- Do the border and shadow feel related to the rest of the page?
- If all glass were removed, would the layout still make sense?
