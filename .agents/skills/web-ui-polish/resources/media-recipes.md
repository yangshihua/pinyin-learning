# Media Recipes

Media should support the section goal, not compete with it. In AetherPane, framing is part of the design system, so the media container matters as much as the asset.

## Media Rules

- Media must support the section goal
- Keep framing consistent
- Avoid multiple equal media focal points in one page
- Prefer shorter, cleaner demonstrations over long video assets
- Use large media for storytelling, not as filler
- Keep copy adjacent and concise

## Current Media Containers

- `display-frame`
- `display-screen`
- `screen-panel`
- `hero-panel`
- `template-visual`

## Aspect Ratio Guidance

- Use taller media frames when the page needs emotional presence
- Use wider frames for product screenshots and dashboard contexts
- Keep one dominant aspect ratio per section
- If multiple media blocks appear on one page, align their radius and framing logic

## Image Strategy

- Hero image:
  large, singular, emotionally anchoring
- Screenshot image:
  supportive, explanatory, cleanly cropped
- Gallery image:
  only when the page needs comparative proof

## Video Strategy

- Use short loops only when they explain interaction
- Keep the clip visually calm
- Do not autoplay noisy UI motion everywhere on the page

## Lazy Loading Guidance

- Lazy-load lower-page media where possible
- Keep the hero asset ready early
- Do not lazy-load the only focal image in a hero if it causes visible popping

## Recipe 1: Framed Showcase Media

```html
<div class="display-frame">
  <div class="display-screen">
    <div class="screen-orb orb-one"></div>
    <div class="screen-orb orb-two"></div>
    <div class="screen-panel glass">
      <p class="mini-label">Guided reveal</p>
      <p class="card-title">Large media, restrained framing</p>
      <p>Enough atmosphere to feel premium, not enough to distract from the product.</p>
    </div>
  </div>
</div>
```

Use when:

- A showcase section needs one dominant media focal point

## Recipe 2: Hero Support Panel

```html
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
```

Use when:

- The hero needs premium framing without a literal screenshot

## Recipe 3: Media Plus Explanation Pair

```html
<section class="section showcase-layout">
  <div class="showcase-copy rise">
    <div class="section-heading">
      <p class="eyebrow">Media frame</p>
      <h2>Containers are part of the design system.</h2>
      <p>Screens, demos, and screenshots should share one edge and shadow language.</p>
    </div>
  </div>
  <div class="showcase-media rise rise-delay">
    <div class="display-frame">
      <div class="display-screen">
        <div class="screen-panel glass">
          <p class="mini-label">Proof</p>
          <p class="card-title">One framed visual moment is enough.</p>
          <p>Keep the copy concise so the media can carry the argument.</p>
        </div>
      </div>
    </div>
  </div>
</section>
```

Use when:

- The media should prove the point and the copy should explain the proof

## Recipe 4: Template Preview Tile

```html
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
```

Use when:

- A documentation or template page needs a small visual preview instead of a full product screenshot

## Recipe 5: Dashboard Support Media

```html
<section class="section dashboard-shell rise">
  <nav class="dashboard-nav glass" aria-label="Workspace">
    <p class="mini-label">Workspace</p>
    <ul>
      <li class="active">Overview</li>
      <li>Deployments</li>
      <li>Insights</li>
    </ul>
  </nav>
  <div class="dashboard-main">
    <div class="panel-grid">
      <article class="content-panel">
        <p class="mini-label">Snapshot</p>
        <p class="card-title">Use media lightly in dashboard contexts.</p>
      </article>
    </div>
  </div>
</section>
```

Use when:

- Utility pages need support visuals without turning into showcase pages

## Media Review Checklist

- Is the media helping the section tell its story?
- Would removing it make the section weaker?
- Is one media item clearly dominant?
- Does the frame share the same radius and shadow logic as the rest of the page?
- Is the asset calm enough to match the page tone?
