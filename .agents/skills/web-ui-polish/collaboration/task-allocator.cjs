const fs = require('fs');
const path = require('path');

const PROFILES_PATH = path.join(__dirname, 'agent-profiles.json');

function loadProfiles() {
  return JSON.parse(fs.readFileSync(PROFILES_PATH, 'utf-8'));
}

function scoreAgent(agent, requirements) {
  let score = 0;
  const strengths = agent.strengths || [];
  const weaknesses = agent.weaknesses || [];

  for (const req of requirements) {
    if (strengths.includes(req)) score += 2;
    if (weaknesses.includes(req)) score -= 1;
  }

  if (agent.speed === 'fast') score += 1;
  if (agent.quality === 'high') score += 1;

  return score;
}

function allocateTask(taskInput) {
  let task;
  if (typeof taskInput === 'string') {
    const raw = fs.readFileSync(taskInput, 'utf-8');
    task = JSON.parse(raw);
  } else {
    task = taskInput;
  }

  const requirements = task.requirements || [];
  const { agents } = loadProfiles();

  const scored = [];
  for (const [id, agent] of Object.entries(agents)) {
    const score = scoreAgent(agent, requirements);
    const matchingStrengths = requirements.filter((r) => agent.strengths.includes(r));
    const matchingWeaknesses = requirements.filter((r) => agent.weaknesses.includes(r));
    scored.push({
      id,
      name: agent.name,
      score,
      matching_strengths: matchingStrengths,
      matching_weaknesses: matchingWeaknesses,
      speed: agent.speed,
      quality: agent.quality,
    });
  }

  scored.sort((a, b) => b.score - a.score);

  return {
    task: task.description || 'Unnamed task',
    requirements,
    priority: task.priority || 'normal',
    recommendations: scored,
    best: scored[0] || null,
  };
}

function parseCliArgs(argv) {
  const args = argv.slice(2);
  let taskFile = null;
  let requirementsFlag = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--requirements' && args[i + 1]) {
      requirementsFlag = args[i + 1].split(',').map((s) => s.trim());
      i++;
    } else if (args[i] === '--priority' && args[i + 1]) {
      i++;
    } else if (!args[i].startsWith('--')) {
      taskFile = args[i];
    }
  }

  return { taskFile, requirementsFlag };
}

if (require.main === module) {
  const { taskFile, requirementsFlag } = parseCliArgs(process.argv);

  let result;

  if (requirementsFlag) {
    result = allocateTask({
      description: 'CLI task',
      requirements: requirementsFlag,
    });
  } else if (taskFile) {
    result = allocateTask(taskFile);
  } else {
    console.log('Usage:');
    console.log('  node task-allocator.cjs <task.json>');
    console.log('  node task-allocator.cjs --requirements semantic_html,copywriting');
    process.exit(0);
  }

  console.log(`Task: ${result.task}`);
  console.log(`Requirements: ${result.requirements.join(', ')}`);
  console.log(`Priority: ${result.priority}`);
  console.log('');
  console.log('Recommendations (best first):');

  for (const rec of result.recommendations) {
    const strengths = rec.matching_strengths.length > 0 ? ` [${rec.matching_strengths.join(', ')}]` : '';
    const weaknesses = rec.matching_weaknesses.length > 0 ? ` (weak: ${rec.matching_weaknesses.join(', ')})` : '';
    console.log(`  ${rec.name.padEnd(14)} score: ${String(rec.score).padStart(3)}  speed: ${rec.speed.padEnd(6)}  quality: ${rec.quality}${strengths}${weaknesses}`);
  }

  if (result.best) {
    console.log('');
    console.log(`Best agent: ${result.best.name} (score: ${result.best.score})`);
  }
}

module.exports = { allocateTask };
