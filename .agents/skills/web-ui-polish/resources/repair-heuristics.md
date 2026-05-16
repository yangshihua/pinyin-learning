# Repair Heuristics

Use this file when the task is not to invent a page from scratch, but to repair a rough or visually weak page without breaking the business logic.

## Diagnostic Order

### 1. Structural problems

Look for:

- weak hierarchy
- repetitive sections
- poor pacing
- too many competing focal points
- missing page ending
- card grids with no purpose

### 2. Visual problems

Look for:

- inconsistent spacing
- weak typography
- cheap-looking surfaces
- noisy effects
- too much glass
- shadows or borders that feel unrelated

### 3. Media problems

Look for:

- too much media
- media overpowering copy
- inconsistent containers
- wrong media type for page context
- screenshots that feel pasted in

### 4. Motion problems

Look for:

- too much animation
- inconsistent motion
- distracting transitions
- motion without purpose
- hover behavior that feels playful instead of precise

## Repair Order

1. fix structure
2. fix hierarchy
3. fix spacing and typography
4. fix surfaces
5. fix media
6. refine motion

## Keep Business Logic Stable

- Do not change data flow unless required
- Do not remove real controls to make the page easier to style
- Refactor wrappers and section structure around existing logic
- Keep semantic meaning and accessibility intact

## Diagnostic Checklist

- What is the page trying to do?
- What should the user notice first?
- Is there one dominant section at the top?
- Does the page have proof, support, and closure?
- Are repeated cards actually carrying distinct jobs?
- Is the current emphasis created by structure or by decoration alone?
- Is the CTA obvious and singular?
- Are surfaces helping hierarchy or obscuring it?
- Do breakpoints collapse cleanly?
- Would the page still feel coherent with motion disabled?

## Problem 1: The hero says too much

Symptoms:

- Very long headline
- Multiple paragraphs
- Three or more equally loud actions

Fix:

- Reduce to one primary statement
- Move support detail into the next section
- Keep one primary and one secondary action

Before:

```html
<section class="section">
  <h1>Everything you need to launch, optimize, scale, and modernize your product</h1>
  <p>Long support copy...</p>
  <button class="button primary">Start</button>
  <button class="button primary">Book demo</button>
  <button class="button primary">Contact sales</button>
</section>
```

After:

```html
<section class="page-hero section">
  <div class="page-hero-copy rise">
    <p class="eyebrow">Landing / Marketing</p>
    <h1>
      Premium pages begin with
      <span>clear narrative rhythm</span>
    </h1>
    <p class="lede">Keep the first message tight, then let the next section add proof.</p>
    <div class="hero-actions">
      <a class="button primary" href="#/showcase">Continue to showcase</a>
      <a class="button secondary" href="#/templates">Review starter templates</a>
    </div>
  </div>
</section>
```

## Problem 2: Every section feels the same

Symptoms:

- Repeated card grids
- Same heading size and same density everywhere

Fix:

- Alternate card sections with single-focus sections
- Increase sectional contrast using layout, not effects

## Problem 3: Too much glass

Symptoms:

- Blur on cards, inner panels, controls, and list items

Fix:

- Keep glass on the shell only
- Convert internal surfaces to solid cards

## Problem 4: The dashboard feels cramped

Symptoms:

- Dense panels with no grouping
- Sidebar and content compete visually

Fix:

- Use `dashboard-shell`
- Group metrics and panels into separate rows
- Quiet the content panel surfaces

Repair pattern:

```html
<section class="section dashboard-shell rise">
  <nav class="dashboard-nav glass" aria-label="Workspace">
    <p class="mini-label">Workspace</p>
    <ul>
      <li class="active">Overview</li>
      <li>Insights</li>
      <li>Activity</li>
    </ul>
  </nav>
  <div class="dashboard-main">
    <div class="metric-row">
      <article class="metric-card">
        <span>Pattern consistency</span>
        <strong>91%</strong>
      </article>
    </div>
    <div class="panel-grid">
      <article class="content-panel">
        <p class="mini-label">Current focus</p>
        <p class="card-title">Hierarchy is carried by layout before chrome.</p>
      </article>
    </div>
  </div>
</section>
```

## Problem 5: Settings page looks like marketing

Symptoms:

- Giant hero visuals
- Too much media
- Decorative card rows instead of grouped controls

Fix:

- Split the page into support copy and grouped settings
- Keep motion and media quieter

## Problem 6: Showcase page has no clear focal proof

Symptoms:

- Many small screenshots
- Copy is longer than the media payoff

Fix:

- Replace multiple equal screenshots with one dominant frame
- Add a short timeline or sequence strip

## Problem 7: Card grids are structurally empty

Symptoms:

- Cards repeat slogans
- No section-level explanation

Fix:

- Add a `SectionHeading`
- Give each card a distinct role: principle, proof, next step, warning

## Problem 8: Motion is flashy

Symptoms:

- Bounce, scale pops, rotating decorations

Fix:

- Revert to `rise`, `rise-delay`, and small hover lifts
- Remove custom animation families

## Problem 9: Mobile collapse feels broken

Symptoms:

- Two-column layouts remain too long
- Buttons overflow
- Media frames become tiny

Fix:

- Respect the existing breakpoints
- Let `hero-actions` wrap
- Collapse grids earlier instead of squeezing content

## Problem 10: The page ends weakly

Symptoms:

- Last section is another generic card row
- No clear next step

Fix:

- Use `cta-band`
- Restate the decision point in one sentence

Repair pattern:

```html
<section class="section cta-band rise">
  <div>
    <p class="eyebrow">Next step</p>
    <h2>Open a starter, switch the style mode, then replace the content.</h2>
  </div>
  <a class="button primary" href="#/templates">Review starter templates</a>
</section>
```

## Repair Prioritization Guide

If the page is broken in many ways:

- First fix section order
- Then fix the first screen users see
- Then fix repeated support sections
- Then correct surface logic
- Then refine motion and hover details

## Fast Repair Decision Tree

```text
Is the page hard to understand?
|
|-- Yes -> Fix hierarchy and section order first
|
Is the page readable but ugly?
|
|-- Yes -> Fix spacing, surfaces, and typography next
|
Is the page polished but too loud?
|
|-- Yes -> Reduce glass, motion, and duplicate emphasis
|
Is the page almost done but weak at the end?
|
|-- Yes -> Add a clear CTA band or final support block
```

## Final Repair Checklist

- Is the page easier to scan than before?
- Is there one focal point per section?
- Did the business logic stay intact?
- Is the page calmer without becoming dull?
- Would the repaired version still pass as one coherent system?
