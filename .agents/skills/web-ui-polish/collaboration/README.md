# Multi-Agent Collaboration Optimizer

Part of the AetherPane skill system. These tools help coordinate multiple AI coding agents by profiling their strengths, allocating tasks intelligently, and optimizing collaboration workflows.

## Agent Profiles

The system profiles five agents with distinct capabilities:

| Agent | Speed | Quality | Best For |
|-------|-------|---------|----------|
| Claude Code | medium | high | Structure, layout, accessibility, system integration |
| GLM | fast | medium-high | Content, localization, full stack, validation |
| Kimi | medium | high | Polish, visual refinement, content |
| Cursor | fast | medium-high | Rapid prototyping, iterative refinement |
| Windsurf | fast | high | Structure, coordination, multi-page |

Profiles are stored in `agent-profiles.json` and can be updated at runtime.

## Tools

### agent-profiler.cjs

Manage agent profiles from the command line.

```bash
# List all agents
node agent-profiler.cjs list

# Show full profile
node agent-profiler.cjs show claude-code

# Update a field (supports dot notation for nested values)
node agent-profiler.cjs update glm speed fast
node agent-profiler.cjs update kimi '["visual_polish","glass_effects"]' strengths
```

Programmatic API:

```js
const { listAgents, showAgent, updateAgent } = require('./agent-profiler.cjs');
listAgents();   // returns array of { id, name, speed, quality, best_for }
showAgent('glm');  // returns full profile
updateAgent('glm', 'speed', 'fast');  // updates and saves
```

### task-allocator.cjs

Score agents against task requirements and recommend the best fit.

```bash
# From a task file
node task-allocator.cjs task.json

# From inline requirements
node task-allocator.cjs --requirements semantic_html,copywriting
```

Task file format:

```json
{
  "description": "Create a landing page for a SaaS product",
  "requirements": ["semantic_html", "complex_layouts", "copywriting"],
  "priority": "high",
  "language": "en"
}
```

Scoring: +2 per matching strength, -1 per matching weakness, +1 if speed=fast, +1 if quality=high.

Programmatic API:

```js
const { allocateTask } = require('./task-allocator.cjs');
const result = allocateTask('./task.json');
console.log(result.best);  // { id, name, score, ... }
```

### workflow-optimizer.cjs

Analyze multi-step workflows, find parallelizable groups, assign agents, and reduce handoffs.

```bash
node workflow-optimizer.cjs workflow.json
```

Workflow format:

```json
{
  "steps": [
    { "id": "structure", "task": "Create page structure", "requirements": ["semantic_html", "complex_layouts"] },
    { "id": "content", "task": "Write content", "requirements": ["copywriting"], "depends_on": ["structure"] },
    { "id": "polish", "task": "Visual polish", "requirements": ["visual_polish", "glass_effects"], "depends_on": ["content"] },
    { "id": "validate", "task": "Validate output", "requirements": ["code_quality"], "depends_on": ["polish"] }
  ]
}
```

Output includes parallel groups, agent assignments, quality estimate, and handoff analysis.

Programmatic API:

```js
const { optimizeWorkflow } = require('./workflow-optimizer.cjs');
const result = optimizeWorkflow('./workflow.json');
```

## Example Workflow

A typical AetherPane page build using the full pipeline:

1. **Define the workflow** with steps and dependencies
2. **Run the optimizer** to get agent assignments and parallel groups
3. **Execute** independent steps in parallel on different agents
4. **Review** handoff count and consolidate where possible

Example output:

```
Total steps: 4
Parallel groups: 4
Estimated quality: 85/100

Group 0:
  structure      -> Claude Code (score: 5)
Group 1:
  content        -> GLM (score: 4)
Group 2:
  polish         -> Kimi (score: 5)
Group 3:
  validate       -> Claude Code (score: 3)
```

## Customizing Agent Profiles

Edit `agent-profiles.json` directly, or use the profiler CLI:

```bash
node agent-profiler.cjs update kimi strengths '["visual_polish","glass_effects","animation_timing","creative_writing"]'
```

Valid speed values: `fast`, `medium`, `slow`
Valid quality values: `low`, `medium`, `medium-high`, `high`

The profiles file is the single source of truth used by all tools.
