const fs = require('fs');
const path = require('path');

const PROFILES_PATH = path.join(__dirname, 'agent-profiles.json');

function loadProfiles() {
  const raw = fs.readFileSync(PROFILES_PATH, 'utf-8');
  return JSON.parse(raw);
}

function saveProfiles(data) {
  data.last_updated = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(PROFILES_PATH, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function listAgents() {
  const { agents } = loadProfiles();
  const rows = [];
  for (const [id, agent] of Object.entries(agents)) {
    rows.push({
      id,
      name: agent.name,
      speed: agent.speed,
      quality: agent.quality,
      best_for: agent.best_for.join(', '),
    });
  }
  return rows;
}

function showAgent(agentId) {
  const { agents } = loadProfiles();
  const id = agentId.toLowerCase().replace(/\s+/g, '-');
  const agent = agents[id];
  if (!agent) {
    const available = Object.keys(agents).join(', ');
    return { error: `Agent "${agentId}" not found. Available: ${available}` };
  }
  return { id, ...agent };
}

function setNestedValue(obj, dotPath, value) {
  const keys = dotPath.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (current[keys[i]] === undefined) current[keys[i]] = {};
    current = current[keys[i]];
  }
  const lastKey = keys[keys.length - 1];
  let parsed = value;
  try {
    parsed = JSON.parse(value);
  } catch {
    parsed = value;
  }
  current[lastKey] = parsed;
}

function updateAgent(agentId, field, value) {
  const data = loadProfiles();
  const id = agentId.toLowerCase().replace(/\s+/g, '-');
  if (!data.agents[id]) {
    return { error: `Agent "${agentId}" not found. Available: ${Object.keys(data.agents).join(', ')}` };
  }
  setNestedValue(data.agents[id], field, value);
  saveProfiles(data);
  return { id, updated: { field, value: data.agents[id] } };
}

function formatTable(rows) {
  if (!rows.length) return '';
  const keys = Object.keys(rows[0]);
  const widths = keys.map((k) => {
    const headerLen = k.length;
    const maxVal = Math.max(...rows.map((r) => String(r[k]).length));
    return Math.max(headerLen, maxVal);
  });
  const header = keys.map((k, i) => k.padEnd(widths[i])).join('  ');
  const sep = widths.map((w) => '-'.repeat(w)).join('  ');
  const body = rows.map((r) =>
    keys.map((k, i) => String(r[k]).padEnd(widths[i])).join('  ')
  );
  return [header, sep, ...body].join('\n');
}

if (require.main === module) {
  const [, , command, ...args] = process.argv;

  if (!command) {
    console.log('Usage: node agent-profiler.cjs <command> [args]');
    console.log('Commands: list, show <agent>, update <agent> <field> <value>');
    process.exit(0);
  }

  switch (command) {
    case 'list': {
      const rows = listAgents();
      console.log(formatTable(rows));
      break;
    }
    case 'show': {
      const agent = args[0];
      if (!agent) {
        console.error('Usage: node agent-profiler.cjs show <agent-name>');
        process.exit(1);
      }
      const result = showAgent(agent);
      if (result.error) {
        console.error(result.error);
        process.exit(1);
      }
      console.log(JSON.stringify(result, null, 2));
      break;
    }
    case 'update': {
      const [aId, field, value] = args;
      if (!aId || !field || value === undefined) {
        console.error('Usage: node agent-profiler.cjs update <agent> <field> <value>');
        process.exit(1);
      }
      const result = updateAgent(aId, field, value);
      if (result.error) {
        console.error(result.error);
        process.exit(1);
      }
      console.log(`Updated ${result.id}.${field}`);
      console.log(JSON.stringify(result.updated, null, 2));
      break;
    }
    default:
      console.error(`Unknown command: ${command}`);
      console.log('Commands: list, show, update');
      process.exit(1);
  }
}

module.exports = { listAgents, showAgent, updateAgent };
