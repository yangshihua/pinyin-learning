# Component And Section Recipes
Use these recipes when you need directly runnable HTML structures that match the current AetherPane demo system. Every example uses classes that already exist in `src/styles.css`.
## Recipe 1: Hero Section
Purpose:
- Landing or showcase page introduction with one dominant message
Required classes:
- `page-hero`
- `page-hero-copy`
- `eyebrow`
- `lede`
- `hero-actions`
- `button primary`
- `button secondary`
HTML:
```html
<section class="page-hero section">
  <div class="page-hero-copy rise">
    <p class="eyebrow">Landing / Marketing</p>
    <h1>
      Premium pages begin with
      <span>clear narrative rhythm</span>
    </h1>
    <p class="lede">
      Lead with one message, then open the system with calm proof and one clear
      next step.
    </p>
    <div class="hero-actions">
      <a class="button primary" href="#/showcase">Continue to showcase</a>
      <a class="button secondary" href="#/templates">Review starter templates</a>
    </div>
  </div>
</section>
```
Optional variants:
- Add `hero-grid` below the intro for paired media and story cards
- Add `glass` only when the hero needs a foreground shell
## Recipe 2: Feature Grid
Purpose:
- Three equal proof points below a landing hero
Required classes:
- `section`
- `card-row`
- `principle-card`
- `card-title`
HTML:
```html
<section class="section card-row">
  <article class="principle-card rise">
    <span>Narrative rhythm</span>
    <p class="card-title">Lead with one idea, then open the system.</p>
    <p>Move from impression to proof without turning the page into a feature wall.</p>
  </article>
  <article class="principle-card rise" style="animation-delay: 90ms;">
    <span>Surface treatment</span>
    <p class="card-title">Use glass where hierarchy benefits from lift.</p>
    <p>Keep reading cards solid and reserve premium blur for the shells that deserve it.</p>
  </article>
  <article class="principle-card rise" style="animation-delay: 180ms;">
    <span>Call to action</span>
    <p class="card-title">Finish with a confident decision point.</p>
    <p>A calm final action works better than one more decorative flourish.</p>
  </article>
</section>
```
Optional variants:
- Replace `principle-card` with `story-card` when the section should feel lighter
## Recipe 3: CTA Band
Purpose:
- Closing section with one message and one action
Required classes:
- `section`
- `cta-band`
- `eyebrow`
- `button primary`
HTML:
```html
<section class="section cta-band rise">
  <div>
    <p class="eyebrow">Launch decision</p>
    <h2>One last invitation is stronger than one last effect.</h2>
  </div>
  <a class="button primary" href="#/showcase">See media-led storytelling</a>
</section>
```
Optional variants:
- Add a secondary button only if the page truly needs a branch
## Recipe 4: Card Grid
Purpose:
- Reusable support card layout for templates, insights, or documentation
Required classes:
- `section`
- `stacked-cards`
- `story-card`
- `mini-label`
- `card-title`
HTML:
```html
<section class="section">
  <div class="stacked-cards rise">
    <article class="story-card">
      <p class="mini-label">Grouping</p>
      <p class="card-title">Settings pages stay premium when sections are obvious.</p>
      <p>Use spacing and copy order before trying stronger decoration.</p>
    </article>
    <article class="story-card">
      <p class="mini-label">Density</p>
      <p class="card-title">Compact does not mean cramped.</p>
      <p>Let utility surfaces breathe even when the page needs more information.</p>
    </article>
  </div>
</section>
```
Optional variants:
- Use `spotlight` on the first card when one idea deserves emphasis
## Recipe 5: Stats Display
Purpose:
- Summary metrics for dashboards, showcases, or documentation
Required classes:
- `metric-row`
- `metric-card`
HTML:
```html
<div class="metric-row">
  <article class="metric-card">
    <span>Design coverage</span>
    <strong>4 page types</strong>
  </article>
  <article class="metric-card">
    <span>Pattern consistency</span>
    <strong>91%</strong>
  </article>
  <article class="metric-card">
    <span>Visual noise</span>
    <strong>Low</strong>
  </article>
  <article class="metric-card">
    <span>Hand-off clarity</span>
    <strong>Strong</strong>
  </article>
</div>
```
Optional variants:
- Collapse to two metrics if the section needs more breathing room
## Recipe 6: Navigation Bar
Purpose:
- Sticky top-level product or preview navigation
Required classes:
- `topbar`
- `glass`
- `brand-lockup`
- `brand-mark`
- `eyebrow`
- `brand-caption`
- `topnav`
- `topnav-link`
HTML:
```html
<header class="topbar glass">
  <div class="brand-lockup">
    <span class="brand-mark"></span>
    <div>
      <p class="eyebrow">AetherPane</p>
      <p class="brand-caption">Calm structure for premium web interfaces</p>
    </div>
  </div>
  <nav class="topnav" aria-label="Primary">
    <a class="topnav-link is-active" href="#/landing">Landing</a>
    <a class="topnav-link" href="#/showcase">Showcase</a>
    <a class="topnav-link" href="#/dashboard">Dashboard</a>
    <a class="topnav-link" href="#/settings">Settings</a>
  </nav>
</header>
```
Optional variants:
- Keep the nav wrapped naturally on narrow screens
## Recipe 7: Footer
Purpose:
- Calm closing block for navigation and system context
Required classes:
- `footer`
- `eyebrow`
- `footer-copy`
- `footer-links`
HTML:
```html
<footer class="footer rise">
  <div>
    <p class="eyebrow">AetherPane System</p>
    <p class="footer-copy">
      A web-only UI system for premium landing pages, showcases, dashboards,
      and settings surfaces.
    </p>
  </div>
  <div class="footer-links">
    <a href="#/landing">Landing</a>
    <a href="#/templates">Templates</a>
    <a href="#/components">Components</a>
    <a href="#/repair">Repair</a>
  </div>
</footer>
```
Optional variants:
- Keep the left side descriptive and the right side short
## Recipe 8: Form Group
Purpose:
- Workspace or account settings block with 2 to 4 related fields
Required classes:
- `form-group-panel`
- `form-group-copy`
- `mini-label`
- `card-title`
- `form-group-fields`
- `form-field`
- `field-label`
- `field-input`
- `field-hint`
HTML:
```html
<section class="form-group-panel" aria-label="Workspace profile">
  <div class="form-group-copy">
    <p class="mini-label">Field group</p>
    <p class="card-title">Workspace profile</p>
    <p>Keep the group readable, with one calm explanation and a small number of related fields.</p>
  </div>
  <div class="form-group-fields">
    <label class="form-field">
      <span class="field-label">Workspace name</span>
      <input class="field-input" type="text" value="AetherPane Studio" />
      <span class="field-hint">Shown in shell headers and internal summaries.</span>
    </label>
    <label class="form-field">
      <span class="field-label">Release contact</span>
      <input class="field-input" type="email" value="team@company.com" />
      <span class="field-hint">Used for release notices and scheduled summary mail.</span>
    </label>
  </div>
</section>
```
Optional variants:
- Pair with `NoticePanel` if the group needs supporting explanation
## Recipe 9: Modal / Dialog
Purpose:
- Elevated confirmation or review step
Required classes:
- `component-surface`
- `modal-stage`
- `modal-shell`
- `glass`
- `mini-label`
- `card-title`
- `hero-actions`
HTML:
```html
<div class="component-surface modal-stage">
  <article class="modal-shell glass" aria-label="Modal preview">
    <p class="mini-label">Modal preview</p>
    <p class="card-title">Confirm a controlled system update.</p>
    <p>Review the latest component tokens, then publish once visual and accessibility checks pass.</p>
    <div class="hero-actions">
      <button class="button primary" type="button">Publish update</button>
      <button class="button secondary" type="button">Keep in review</button>
    </div>
  </article>
</div>
```
Optional variants:
- Use `DrawerShell` instead when the user should not lose page context
## Recipe 10: Image / Media Gallery
Purpose:
- Premium showcase strip with one main media frame and supporting cards
Required classes:
- `section`
- `showcase-layout`
- `display-frame`
- `display-screen`
- `screen-panel`
- `timeline-strip`
- `timeline-step`
HTML:
```html
<section class="section showcase-layout">
  <div class="showcase-copy rise">
    <div class="timeline-strip">
      <div class="timeline-step">
        <span>01</span>
        <strong>Overview reveal</strong>
      </div>
      <div class="timeline-step">
        <span>02</span>
        <strong>Guided interaction</strong>
      </div>
      <div class="timeline-step">
        <span>03</span>
        <strong>Focused detail</strong>
      </div>
    </div>
  </div>
  <div class="showcase-media rise rise-delay">
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
  </div>
</section>
```
Optional variants:
- Replace the orb background with a real product screenshot inside the same frame
## Recipe Selection Guide
- Need a page opener:
  Use Hero Section
- Need proof points:
  Use Feature Grid or Card Grid
- Need utility summary:
  Use Stats Display or Dashboard Shell combinations
- Need utility controls:
  Use Form Group, Tabs, and Dropdown
- Need product storytelling:
  Use Image / Media Gallery
## Recipe 11: Tabs
Purpose:
- Switch content inside one section without changing the page shell
Required classes:
- `tabs-root`
- `tabs-list`
- `tabs-trigger`
- `tabs-content`
HTML:
```html
<div class="tabs-root">
  <div class="tabs-list" role="tablist" aria-label="Workspace sections">
    <button class="tabs-trigger" data-state="active" role="tab" type="button">
      Overview
    </button>
    <button class="tabs-trigger" role="tab" type="button">
      Details
    </button>
    <button class="tabs-trigger" data-disabled disabled role="tab" type="button">
      Settings
    </button>
  </div>
  <div class="tabs-content" data-state="active" role="tabpanel">
    <p class="mini-label">Overview</p>
    <p class="card-title">Tabs should switch context without changing the visual language.</p>
  </div>
</div>
```
Usage notes:
- Use tabs for compact context switching inside dashboards, settings, or docs
- Keep tab labels short
- Disable tabs only when the destination exists conceptually but should not yet open
## Recipe 12: Dropdown
Purpose:
- Compact option selection with grouped items and keyboard navigation
Required classes:
- `dropdown-root`
- `dropdown-trigger`
- `dropdown-content`
- `dropdown-item`
- `dropdown-separator`
HTML:
```html
<div class="dropdown-root">
  <button class="dropdown-trigger" type="button" role="combobox" aria-expanded="true">
    <span>Stable</span>
    <span class="dropdown-caret" aria-hidden="true">v</span>
  </button>
  <div class="dropdown-content glass" data-side="bottom" role="listbox">
    <button class="dropdown-item" data-selected role="option" type="button">
      <span>Stable</span>
      <span aria-hidden="true">Check</span>
    </button>
    <button class="dropdown-item" role="option" type="button">
      <span>Beta</span>
    </button>
    <div class="dropdown-separator" role="separator"></div>
    <button class="dropdown-item" data-disabled disabled role="option" type="button">
      <span>Preview</span>
    </button>
  </div>
</div>
```
Usage notes:
- Use dropdowns for compact selection, not for huge navigation trees
- Group related options with separators
- Keep the trigger text explicit so the selected state remains obvious
## Recipe 13: Tooltip
Purpose:
- Short contextual help for compact controls and unfamiliar labels
Required classes:
- `tooltip-root`
- `tooltip-content`
- `tooltip-arrow`
HTML:
```html
<span class="tooltip-root">
  <button class="button secondary" type="button" aria-describedby="tooltip-demo">
    Hover me
  </button>
  <span class="tooltip-content glass" data-side="top" id="tooltip-demo" role="tooltip">
    Use tooltips for short help, not dense documentation.
    <span class="tooltip-arrow" aria-hidden="true"></span>
  </span>
</span>
```
Usage notes:
- Use tooltips for short explanation, not critical instructions
- Support both hover and focus
- Keep the copy brief enough to scan in one glance
## Shared Recipe Rules
- Keep one clear job per section
- Reuse spacing language
- Reuse surface logic
- Reuse motion language
- Reuse media framing
- Let one element carry the premium emphasis
