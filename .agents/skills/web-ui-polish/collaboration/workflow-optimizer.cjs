const fs = require('fs');
const path = require('path');
const { allocateTask } = require('./task-allocator.cjs');

function loadWorkflow(input) {
  if (typeof input === 'string') {
    const raw = fs.readFileSync(input, 'utf-8');
    return JSON.parse(raw);
  }
  return input;
}

function topologicalSort(steps) {
  const stepMap = new Map();
  for (const step of steps) {
    stepMap.set(step.id, step);
  }

  const visited = new Set();
  const order = [];

  function visit(id) {
    if (visited.has(id)) return;
    visited.add(id);
    const step = stepMap.get(id);
    if (step && step.depends_on) {
      for (const dep of step.depends_on) {
        visit(dep);
      }
    }
    order.push(id);
  }

  for (const step of steps) {
    visit(step.id);
  }

  return order;
}

function findParallelGroups(steps) {
  const stepMap = new Map();
  for (const step of steps) stepMap.set(step.id, step);

  const order = topologicalSort(steps);
  const groups = [];
  const completedAt = new Map();

  for (const id of order) {
    const step = stepMap.get(id);
    const deps = step.depends_on || [];
    let groupIdx = 0;

    if (deps.length > 0) {
      groupIdx = Math.max(...deps.map((d) => (completedAt.get(d) || 0) + 1));
    }

    while (groups.length <= groupIdx) groups.push([]);
    groups[groupIdx].push(step);
    completedAt.set(id, groupIdx);
  }

  return groups;
}

function assignAgent(step) {
  const task = {
    description: step.task,
    requirements: step.requirements || [],
  };
  const result = allocateTask(task);
  return result.best;
}

function estimateQuality(assignments) {
  if (assignments.length === 0) return 0;
  const total = assignments.reduce((sum, a) => sum + Math.max(a.score, 0), 0);
  return Math.min(100, Math.round((total / assignments.length) * 20));
}

function optimizeWorkflow(workflowInput) {
  const workflow = loadWorkflow(workflowInput);
  const steps = workflow.steps || workflow;

  if (!Array.isArray(steps) || steps.length === 0) {
    return { error: 'Workflow must contain a non-empty "steps" array.' };
  }

  const parallelGroups = findParallelGroups(steps);

  const assignments = [];
  const optimizedSteps = [];

  for (let gIdx = 0; gIdx < parallelGroups.length; gIdx++) {
    const group = parallelGroups[gIdx];
    const groupAssignments = [];

    for (const step of group) {
      const bestAgent = assignAgent(step);
      const entry = {
        step_id: step.id,
        task: step.task,
        requirements: step.requirements || [],
        assigned_agent: bestAgent ? bestAgent.name : null,
        agent_id: bestAgent ? bestAgent.id : null,
        score: bestAgent ? bestAgent.score : 0,
        parallel_group: gIdx,
        depends_on: step.depends_on || [],
      };
      groupAssignments.push(entry);
      assignments.push(entry);
    }

    optimizedSteps.push({
      parallel_group: gIdx,
      can_run_parallel: group.length > 1,
      steps: groupAssignments,
    });
  }

  const qualityScore = estimateQuality(assignments);

  const handoffReduction = analyzeHandoffs(assignments);

  return {
    total_steps: steps.length,
    parallel_groups: parallelGroups.length,
    estimated_quality: qualityScore,
    handoff_analysis: handoffReduction,
    workflow: optimizedSteps,
  };
}

function analyzeHandoffs(assignments) {
  if (assignments.length <= 1) {
    return { total_handoffs: 0, suggestion: 'Single step - no handoff needed.' };
  }

  let handoffs = 0;
  for (let i = 1; i < assignments.length; i++) {
    if (assignments[i].agent_id !== assignments[i - 1].agent_id) {
      handoffs++;
    }
  }

  const agentCounts = {};
  for (const a of assignments) {
    agentCounts[a.agent_id || 'unassigned'] = (agentCounts[a.agent_id || 'unassigned'] || 0) + 1;
  }

  const dominantAgent = Object.entries(agentCounts).sort((a, b) => b[1] - a[1])[0];

  let suggestion;
  if (handoffs === 0) {
    suggestion = `All steps handled by single agent (${dominantAgent[0]}). Optimal.`;
  } else if (handoffs <= 2) {
    suggestion = `${handoffs} handoff(s). Consider batching related steps for the same agent.`;
  } else {
    suggestion = `${handoffs} handoffs detected. Consider consolidating steps to reduce context switching.`;
  }

  return {
    total_handoffs: handoffs,
    dominant_agent: dominantAgent[0],
    suggestion,
  };
}

if (require.main === module) {
  const [, , inputFile] = process.argv;

  if (!inputFile) {
    console.log('Usage: node workflow-optimizer.cjs <workflow.json>');
    process.exit(0);
  }

  const result = optimizeWorkflow(inputFile);

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }

  console.log(`Total steps: ${result.total_steps}`);
  console.log(`Parallel groups: ${result.parallel_groups}`);
  console.log(`Estimated quality: ${result.estimated_quality}/100`);
  console.log('');
  console.log(`Handoff analysis: ${result.handoff_analysis.suggestion}`);
  console.log(`  Total handoffs: ${result.handoff_analysis.total_handoffs}`);
  console.log('');

  for (const group of result.workflow) {
    const label = group.can_run_parallel ? ' (parallel)' : '';
    console.log(`Group ${group.parallel_group}${label}:`);
    for (const step of group.steps) {
      const deps = step.depends_on.length > 0 ? ` depends: [${step.depends_on.join(', ')}]` : '';
      console.log(`  ${step.step_id.padEnd(14)} -> ${step.assigned_agent || 'unassigned'} (score: ${step.score})${deps}`);
    }
  }
}

module.exports = { optimizeWorkflow };
