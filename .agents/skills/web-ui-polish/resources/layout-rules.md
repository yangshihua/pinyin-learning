# Layout Rules
Use layout to communicate hierarchy before styling does. AetherPane pages should feel obviously structured even with all decorative styling removed.
## Core Layout Principles
- One focal point per section
- One main job per section
- Avoid repetitive section clones across the page
- Alternate density and pacing where appropriate
- Let larger sections breathe
- Use whitespace to create structure, not emptiness
- Keep content widths intentional
- Do not let copy stretch too wide
- Use consistent section padding logic
## Container Rules
### Page container
- `--container-max` is the max working width for the page shell
- The page shell uses `width: min(calc(100% - 40px), var(--container-max))`
- On narrow screens the shell becomes `min(calc(100% - 24px), var(--container-max))`
What this means in practice:
- The outer page should feel premium and framed, not edge-to-edge
- Large screens still need a readable text width
- The container is wide enough for paired layouts but not so wide that the hero loses tension
### Copy width
- Page-intro copy should generally stay inside `page-hero-copy`
- Body paragraphs should live inside `lede`, `section-heading p`, `story-card p`, `settings-group p`, or similar containers that already manage readable width
- Avoid raw full-width paragraphs inside large sections
## Section Spacing Rules
### Standard rhythm
- Use `.section` for every major block
- `.section` uses `--space-section`
- At mobile widths it switches to `--space-section-mobile`
Why it matters:
- The rhythm is part of the brand feel
- Inconsistent manual spacing makes the page feel improvised
### Dense sections
Use denser sections only when:
- The content is utility-heavy
- The page already has a strong primary section above it
- The design still reads in obvious blocks
### Spacious sections
Use more generous pacing when:
- The section introduces a new topic
- The section contains large media
- The section is the final CTA or hero
## Grid System Rules
### Two-column layouts
Use:
- `.hero-grid`
- `.showcase-layout`
- `.settings-layout`
- `.component-showcase`
Characteristics:
- Two primary columns
- One side usually carries focus
- The other side provides support, proof, or utility
### Metric and card grids
Use:
- `.card-row`
- `.metric-row`
- `.panel-grid`
- `.stage-grid`
Characteristics:
- Repeatable system cards
- Equal-width items
- Controlled density
### Dashboard shell layouts
Use:
- `.dashboard-shell`
- `.dashboard-main`
Characteristics:
- Sidebar plus work surface
- Strong shell logic
- Clear visual separation between navigation and content
## Hierarchy Rules
- Layout must communicate priority before visual effects do
- Major sections should be easy to distinguish at a glance
- The hero should not look like the same layout as the footer
- Summary cards should not visually compete with the page hero
- Settings groups should feel like grouped controls, not marketing cards
## Breakpoint Strategy
### Default breakpoint
At `1100px` and below:
- Two-column section layouts collapse to one column
- Dashboard shell collapses to a stacked layout
- Card grids and metric grids collapse to one column
- Footer and CTA bands stack vertically
### Mobile breakpoint
At `720px` and below:
- Page shell tightens horizontally
- Section padding switches to the mobile spacing token
- Large display frames reduce internal padding
- Media panels shrink to maintain readability
## Layout Example 1: Landing Hero With Support Grid
```html
<section class="page-hero section">
  <div class="page-hero-copy rise">
    <p class="eyebrow">Landing / Marketing</p>
    <h1>
      Premium pages begin with
      <span>clear narrative rhythm</span>
    </h1>
    <p class="lede">
      A strong opening should establish one promise before the page opens into proof.
    </p>
    <div class="hero-actions">
      <a class="button primary" href="#/showcase">Continue to showcase</a>
      <a class="button secondary" href="#/templates">Review starter templates</a>
    </div>
  </div>
</section>
<section class="section hero-grid">
  <div class="hero-media rise">
    <div class="hero-panel glass">
      <div class="panel-caption">
        <span class="caption-dot"></span>
        Landing structure
      </div>
      <div class="stage-grid">
        <article class="stage-card spotlight">
          <p>Module 1</p>
          <strong>Focused message</strong>
        </article>
        <article class="stage-card">
          <p>Module 2</p>
          <strong>Proof and invitation</strong>
        </article>
      </div>
    </div>
  </div>
  <div class="stacked-cards rise rise-delay">
    <article class="story-card">
      <p class="mini-label">Support</p>
      <p class="card-title">The secondary column should explain, not compete.</p>
      <p>Use story cards to support the main pitch without turning the section into a wall of content.</p>
    </article>
  </div>
</section>
```
## Layout Example 2: Product Showcase Pairing
```html
<section class="section showcase-layout">
  <div class="showcase-copy rise">
    <div class="section-heading">
      <p class="eyebrow">Showcase sequence</p>
      <h2>Each section carries one visual argument.</h2>
      <p>One explanation block, one visual frame, and one short timeline are enough.</p>
    </div>
    <div class="timeline-strip">
      <div class="timeline-step">
        <span>01</span>
        <strong>Overview reveal</strong>
      </div>
      <div class="timeline-step">
        <span>02</span>
        <strong>Guided interaction</strong>
      </div>
    </div>
  </div>
  <div class="showcase-media rise rise-delay">
    <div class="display-frame">
      <div class="display-screen">
        <div class="screen-panel glass">
          <p class="mini-label">Guided reveal</p>
          <p class="card-title">Large media, restrained framing</p>
          <p>Use one focal frame and let the media do the persuasion.</p>
        </div>
      </div>
    </div>
  </div>
</section>
```
## Layout Example 3: Dashboard Shell
```html
<section class="section dashboard-shell rise">
  <nav class="dashboard-nav glass" aria-label="Workspace">
    <p class="mini-label">Workspace</p>
    <ul>
      <li class="active">Overview</li>
      <li>Deployments</li>
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
      <article class="metric-card">
        <span>Visual noise</span>
        <strong>Low</strong>
      </article>
    </div>
    <div class="panel-grid">
      <article class="content-panel">
        <p class="mini-label">Current focus</p>
        <p class="card-title">Hierarchy is carried by layout before chrome.</p>
      </article>
      <article class="content-panel">
        <p class="mini-label">Next step</p>
        <p class="card-title">Turn recurring shell patterns into reusable dashboard states.</p>
      </article>
    </div>
  </div>
</section>
```
## Layout Example 4: Settings Split
```html
<section class="section settings-layout">
  <div class="stacked-cards rise">
    <article class="story-card">
      <p class="mini-label">Grouping</p>
      <p class="card-title">Settings pages stay premium when sections are obvious.</p>
      <p>Support cards explain the page and grouped controls carry the actual work.</p>
    </article>
  </div>
  <div class="settings-panel rise rise-delay">
    <article class="settings-group">
      <div>
        <p class="mini-label">Motion</p>
        <p class="card-title">Restrained transitions only</p>
        <p>Prefer subtle fades and reveals across interface states.</p>
      </div>
      <button class="toggle active" type="button" aria-pressed="true">
        <span></span>
      </button>
    </article>
  </div>
</section>
```
## Layout Example 5: Templates Grid
```html
<section class="section">
  <div class="template-grid">
    <article class="template-card rise">
      <div class="template-visual template-theme-classic">
        <span class="template-theme-badge">Classic</span>
        <div class="template-visual-shell">
          <div class="template-visual-bar template-visual-bar-wide"></div>
          <div class="template-visual-columns">
            <div class="template-visual-stack">
              <div class="template-visual-bar"></div>
              <div class="template-visual-bar template-visual-bar-soft"></div>
            </div>
            <div class="template-visual-panel"></div>
          </div>
        </div>
      </div>
      <div class="template-card-copy">
        <p class="mini-label">Launch starter</p>
        <p class="card-title">Marketing landing template</p>
        <p>A user-ready launch page starter with a hero, proof strip, and final CTA.</p>
      </div>
    </article>
  </div>
</section>
```
## Layout Repair Notes
- If a page feels noisy, remove columns before adding more decoration
- If a page feels flat, improve section rhythm before adding blur
- If a dashboard feels busy, increase grouping clarity before reducing content
- If a landing page feels weak, strengthen the first section before changing the rest
