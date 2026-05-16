---
name: Multi-Agent Collaboration Protocol
version: 1.0.0
description: Standardized protocol for multiple AI agents to collaborate on UI development tasks
category: collaboration
subcategory: multi-agent
author: AetherPane Team
---

# Multi-Agent Collaboration Protocol

Defines how multiple AI agents work together on AetherPane UI tasks. Each agent has a clear role, handoff format, and communication standard.

## 1. Collaboration Patterns

### 1.1 Sequential Pipeline

Agents work one after another, each building on the previous agent's output.

```
Request -> Structure Agent -> Content Agent -> Polish Agent -> Validation Agent -> Output
```

**When to use**: Full page creation, multi-step builds.

**Handoff**: Each agent writes a manifest.json before passing to the next agent.

### 1.2 Parallel Specialization

Multiple agents work on independent sections simultaneously.

```
Request -> Coordinator splits tasks
  |-- Agent A: Hero section
  |-- Agent B: Feature section
  |-- Agent C: CTA section
  -> Merge -> Validation Agent -> Output
```

**When to use**: Large pages with clearly independent sections.

**Handoff**: Coordinator provides section boundaries and shared context. Each agent delivers a section fragment.

### 1.3 Iterative Refinement

One agent creates, another reviews and improves, repeating until quality threshold is met.

```
Agent A (build) -> Agent B (critique) -> Agent A (refine) -> ... -> ODS >= 7.5 -> Output
```

**When to use**: Polish passes, design iteration, quality improvement.

**Handoff**: Critique agent returns a structured review with scores and specific fixes.

## 2. Handoff Format

### 2.1 Manifest File Structure

Each agent writes a `manifest.json` alongside their output files.

```json
{
  "version": "1.0.0",
  "task_id": "landing-page-2026-04-08",
  "page_type": "landing",
  "theme": "classic",
  "current_stage": "structure",
  "agent": {
    "name": "claude-code",
    "role": "structure",
    "timestamp": "2026-04-08T10:00:00Z"
  },
  "files": [
    {
      "path": "src/pages/LandingPage.jsx",
      "action": "created",
      "description": "Full landing page with hero, features, and CTA sections"
    }
  ],
  "scores": {
    "visual_hierarchy": 8.0,
    "breathing_space": 7.5,
    "glass_quality": 9.0,
    "typography": 8.0,
    "overall": 8.1
  },
  "next_agent": {
    "role": "polish",
    "suggestions": ["Improve hero spacing", "Add rise animations"]
  },
  "notes": "Structure complete. Business logic preserved. Needs visual polish."
}
```

### 2.2 File Naming Convention

```
[page-type]-[section]-[agent-role].[ext]

Examples:
  landing-hero-structure.jsx
  landing-features-content.jsx
  landing-full-polish.jsx
  dashboard-metrics-structure.jsx
```

### 2.3 Context File

When handing off, agents should include a context summary:

```json
{
  "business_logic_preserved": true,
  "components_used": ["page-hero", "card-row", "cta-band"],
  "theme": "classic",
  "dependencies": ["src/styles.css", "src/tokens.css"],
  "known_issues": ["Mobile layout needs testing at 720px"]
}
```

## 3. Agent Roles and Responsibilities

### 3.1 Structure Agent

**Agents**: Claude Code, Codex, GLM

**Responsibilities**:
- Analyze requirements and determine page type
- Create section order and layout structure
- Apply semantic HTML and correct AetherPane classes
- Set heading hierarchy (h1, h2, card-title)
- Ensure responsive grid structure

**Output**:
- Complete page structure with correct class names
- All sections in correct order
- Semantic HTML tags (main, section, article)
- Correct grid layouts (hero-grid, card-row, etc.)

**Quality check**:
- Section count >= 3
- Semantic tags present
- Heading hierarchy correct
- Grid classes applied

### 3.2 Content Agent

**Agents**: GLM, Kimi

**Responsibilities**:
- Write clear, concise copy for each section
- Apply correct content classes (eyebrow, lede, card-title, mini-label)
- Ensure one idea per card/section
- Write accessible alt text for images
- Maintain consistent tone

**Output**:
- All text content filled in
- Correct content classes applied
- Alt text on all images
- Consistent voice throughout

**Quality check**:
- No placeholder text (Lorem ipsum)
- Alt text on all images
- One idea per card
- CTA text is clear and actionable

### 3.3 Polish Agent

**Agents**: Kimi, MiniMax, Claude Code

**Responsibilities**:
- Apply surface treatment (glass, shadows, borders)
- Add motion classes (rise, rise-delay)
- Fine-tune spacing and alignment
- Add visual accents (accent span in h1, spotlight cards)
- Ensure consistent token usage

**Output**:
- Glass applied only to shells
- Motion classes added to major blocks
- Spacing tokens used consistently
- Visual accents in place

**Quality check**:
- GQM score >= 7 (no glass overuse)
- Motion is subtle (no bounce or flashy effects)
- Token usage consistent
- Hover states functional

### 3.4 Validation Agent

**Agents**: MiniMax, GLM, any agent running scripts

**Responsibilities**:
- Run validate-html.js
- Run validate-a11y.js
- Run validate-tokens.js
- Run design-critique.js
- Compile quality report
- Approve or reject output

**Output**:
- Validation report with all scores
- List of issues to fix (if any)
- Approval status (pass/fail)

**Quality check**:
- ODS >= 7.5 for approval
- No critical errors
- All required checks pass

## 4. Communication Protocol

### 4.1 Message Format

Agents communicate through structured messages in the manifest:

```json
{
  "from": "structure-agent",
  "to": "polish-agent",
  "type": "handoff",
  "priority": "normal",
  "body": {
    "status": "complete",
    "files": ["src/pages/LandingPage.jsx"],
    "instructions": "Apply glass and motion polish. Keep all business logic intact.",
    "constraints": ["Do not change section order", "Preserve CTA logic"]
  }
}
```

### 4.2 Message Types

| Type | Description |
|------|-------------|
| `handoff` | Passing work to the next agent |
| `review` | Returning critique with scores |
| `fix-request` | Asking previous agent to fix specific issues |
| `approval` | Validation agent approves output |
| `rejection` | Validation agent rejects with specific reasons |

### 4.3 Priority Levels

| Priority | Description |
|----------|-------------|
| `critical` | Blocks other agents, must be addressed immediately |
| `high` | Important, should be addressed before continuing |
| `normal` | Standard handoff or review |
| `low` | Optional suggestion or improvement |

## 5. Error Handling

### 5.1 Common Failures

| Failure | Detection | Recovery |
|---------|-----------|----------|
| Broken HTML structure | validate-html.js returns errors | Structure agent rebuilds affected sections |
| Accessibility issues | validate-a11y.js returns errors | Content or structure agent fixes |
| Token misuse | validate-tokens.js returns warnings | Polish agent replaces hardcoded values |
| Low design score | design-critique.js returns ODS < 7.0 | Polish agent reworks lowest-scoring areas |
| Missing sections | Page has < 3 sections | Structure agent adds missing sections |
| Glass overuse | GQM score < 5 | Polish agent removes glass from content surfaces |

### 5.2 Escalation

```
If an agent fails 3 times:
  1. Log the failure pattern
  2. Switch to a different agent for that role
  3. Simplify the task (reduce scope)
  4. Fall back to basic page pattern
```

### 5.3 Fallback Patterns

When collaboration fails, agents should fall back to the simplest working pattern:

```
Fallback page structure:
  1. page-hero with h1 + lede + button.primary
  2. card-row with 3 principle-cards
  3. cta-band with h2 + button.primary
```

## 6. Example Workflows

### 6.1 Landing Page Creation

```
1. User request: "Create a landing page for a SaaS product"

2. Coordinator assigns:
   - Page type: landing
   - Theme: classic (professional SaaS)
   - Pattern: sequential pipeline

3. Structure Agent (Claude Code):
   - Creates LandingPage.jsx
   - Sections: hero, features (card-row), proof (stacked-cards), cta-band
   - Applies: page-hero, hero-grid, card-row, cta-band classes
   - Manifest: stage=structure, scores=estimated

4. Content Agent (GLM):
   - Fills hero copy: eyebrow, h1, lede
   - Fills feature cards: mini-label, card-title, paragraph
   - Fills CTA: h2, button text
   - Manifest: stage=content, scores=estimated

5. Polish Agent (Kimi):
   - Adds .glass to hero-panel and dashboard-nav
   - Adds .rise and .rise-delay
   - Adds accent span in h1
   - Fine-tunes spacing
   - Manifest: stage=polish, scores=measured

6. Validation Agent (MiniMax):
   - Runs all 4 scripts
   - Reports: ODS=8.2, all checks pass
   - Status: approved
```

### 6.2 Dashboard Development

```
1. User request: "Build a dashboard overview page"

2. Coordinator assigns:
   - Page type: dashboard
   - Theme: signal (data-focused)
   - Pattern: sequential pipeline

3. Structure Agent:
   - Creates DashboardPage.jsx
   - Sections: hero, dashboard-shell (nav + metrics + panels)
   - Applies: dashboard-shell, metric-row, panel-grid classes
   - Sets data-theme="signal"

4. Content Agent:
   - Fills metric values and labels
   - Fills panel content
   - Writes nav items

5. Polish Agent:
   - Adds .glass to dashboard-nav
   - Adds .rise to metric cards and panels
   - Keeps glass minimal (signal theme)

6. Validation Agent:
   - Runs all 4 scripts
   - Reports: ODS=8.5, glass usage appropriate
   - Status: approved
```

### 6.3 Multi-Page Website

```
1. User request: "Build a marketing site with 4 pages"

2. Coordinator assigns:
   - Pages: landing, showcase, dashboard (demo), settings
   - Theme: classic
   - Pattern: parallel specialization

3. Parallel execution:
   - Agent A: Landing page (hero + features + CTA)
   - Agent B: Showcase page (hero + display-frame + timeline)
   - Agent C: Dashboard page (shell + metrics + panels)
   - Agent D: Settings page (layout + groups + toggles)

4. Merge:
   - Coordinator assembles pages into router
   - Ensures consistent theme and topbar across pages

5. Validation Agent:
   - Runs critique on each page
   - Ensures consistency across pages
   - Approves or requests fixes per page
```

## 7. Supported Agents

| Agent | Strengths | Recommended Roles |
|-------|-----------|-------------------|
| Claude Code | Structure, code quality, system understanding | Structure, Polish, Coordinator |
| Codex | Code generation, pattern matching | Structure |
| GLM | Content, multilingual, balanced output | Content, Structure, Validation |
| Kimi | Creative writing, visual sense | Content, Polish |
| MiniMax | Analysis, scoring, consistency | Validation, Coordinator |
| Cursor | IDE integration, rapid iteration | Any (interactive mode) |
| Windsurf | Flow-based development, multi-file | Structure, Coordinator |
