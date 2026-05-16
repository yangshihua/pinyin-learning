const fs = require("fs");
const path = require("path");

const PATTERNS_DIR = __dirname;
const REGISTRY_FILE = path.join(PATTERNS_DIR, "pattern-registry.json");

function loadRegistry() {
  const raw = fs.readFileSync(REGISTRY_FILE, "utf-8");
  return JSON.parse(raw);
}

function loadPattern(patternId) {
  const registry = loadRegistry();
  const entry = registry.patterns.find((p) => p.id === patternId);
  if (!entry) {
    throw new Error(`Pattern not found: ${patternId}`);
  }
  const filePath = path.join(PATTERNS_DIR, entry.file);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

function listPatterns() {
  const registry = loadRegistry();
  return registry.patterns.map((p) => ({
    id: p.id,
    category: p.category,
    quality_score: p.quality_score,
  }));
}

function fillTemplate(html, variables, overrides) {
  let result = html;
  const merged = { ...variables };
  for (const key of Object.keys(overrides || {})) {
    if (merged[key]) {
      merged[key].value = overrides[key];
    }
  }
  for (const [key, config] of Object.entries(merged)) {
    const value = config.value || config.default;
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    result = result.replace(placeholder, value);
  }
  return result;
}

function renderPattern(pattern, overrides) {
  const html = fillTemplate(
    pattern.structure.html,
    pattern.structure.variables,
    overrides
  );
  return html;
}

function buildTopbar(title) {
  return `  <nav class="topbar glass" aria-label="Primary">
    <span class="topbar-brand">${title}</span>
    <ul class="topbar-links">
      <li><a href="#">Features</a></li>
      <li><a href="#">Pricing</a></li>
      <li><a href="#">Docs</a></li>
    </ul>
  </nav>`;
}

function buildCTABand() {
  return `<section class="section cta-band rise">
  <div>
    <p class="eyebrow">Next step</p>
    <h2>Ready to get started?</h2>
    <p class="lede">One last invitation is stronger than one last effect.</p>
  </div>
  <a href="#" class="button primary">Continue</a>
</section>`;
}

function buildFooter() {
  return `  <footer class="section footer">
    <p>&copy; 2026 AetherPane. Built with structure and restraint.</p>
  </footer>`;
}

function composePage(options) {
  const {
    hero,
    features,
    ctaBand = false,
    theme = "classic",
    title = "AetherPane Page",
    output = null,
    overrides = {},
  } = options;

  const sections = [];

  if (hero) {
    const pattern = loadPattern(hero);
    sections.push(renderPattern(pattern, overrides));
  }

  if (features) {
    const pattern = loadPattern(features);
    sections.push(renderPattern(pattern, overrides));
  }

  if (ctaBand) {
    sections.push(buildCTABand());
  }

  const body = sections.join("\n\n");
  const topbar = buildTopbar(title);
  const footer = buildFooter();

  const html = `<!DOCTYPE html>
<html lang="en" data-theme="${theme}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="../../src/tokens.css">
  <link rel="stylesheet" href="../../src/styles.css">
</head>
<body>
${topbar}

${body}

${footer}
</body>
</html>`;

  if (output) {
    const outputPath = path.resolve(output);
    fs.writeFileSync(outputPath, html, "utf-8");
    return { outputPath, size: Buffer.byteLength(html, "utf-8") };
  }

  return { html };
}

function printUsage() {
  console.log(`
AetherPane Pattern Composer
===========================

Usage:
  node compose.cjs <command> [options]

Commands:
  list                    List all available patterns
  show <pattern-id>       Show details for a specific pattern
  build [options]         Compose a full HTML page from patterns

Build options:
  --hero <pattern-id>     Hero pattern to include
  --features <pattern-id> Feature/card pattern to include
  --cta-band              Include a standard CTA band section
  --theme <theme>         Theme: classic, editorial, or signal (default: classic)
  --title <string>        Page title (default: "AetherPane Page")
  --output <file>         Output HTML file path

Examples:
  node compose.cjs list
  node compose.cjs show hero-centered-cta
  node compose.cjs build --hero hero-centered-cta --features card-feature-grid --cta-band --title "My Page" --output page.html
`.trim());
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "help" || args[0] === "--help") {
    printUsage();
    return;
  }

  const command = args[0];

  if (command === "list") {
    const patterns = listPatterns();
    console.log("\nAvailable Patterns:\n");
    for (const p of patterns) {
      console.log(`  ${p.id.padEnd(28)} [${p.category}]  quality: ${p.quality_score}`);
    }
    console.log();
    return;
  }

  if (command === "show") {
    const patternId = args[1];
    if (!patternId) {
      console.error("Error: provide a pattern id. Usage: show <pattern-id>");
      process.exit(1);
    }
    const pattern = loadPattern(patternId);
    console.log("\nPattern:", pattern.name);
    console.log("ID:", pattern.id);
    console.log("Category:", pattern.category);
    console.log("Quality:", pattern.quality_score);
    console.log("Themes:", pattern.themes.join(", "));
    console.log("\nDescription:\n", pattern.description);
    console.log("\nBest for:", pattern.usage.best_for.join(", "));
    console.log("Avoid when:", pattern.usage.avoid_when.join(", "));
    console.log("\nVariables:");
    for (const [key, config] of Object.entries(pattern.structure.variables)) {
      console.log(`  ${key} (${config.type}): ${config.default}`);
    }
    console.log("\nHTML Template:\n", pattern.structure.html);
    if (pattern.variants && pattern.variants.length > 0) {
      console.log("\nVariants:");
      for (const v of pattern.variants) {
        console.log(`  - ${v.name}: ${v.description}`);
      }
    }
    console.log();
    return;
  }

  if (command === "build") {
    let hero = null;
    let features = null;
    let ctaBand = false;
    let theme = "classic";
    let title = "AetherPane Page";
    let output = null;

    for (let i = 1; i < args.length; i++) {
      if (args[i] === "--hero" && args[i + 1]) {
        hero = args[++i];
      } else if (args[i] === "--features" && args[i + 1]) {
        features = args[++i];
      } else if (args[i] === "--cta-band") {
        ctaBand = true;
      } else if (args[i] === "--theme" && args[i + 1]) {
        theme = args[++i];
      } else if (args[i] === "--title" && args[i + 1]) {
        title = args[++i];
      } else if (args[i] === "--output" && args[i + 1]) {
        output = args[++i];
      }
    }

    if (!hero && !features) {
      console.error("Error: provide at least --hero or --features to build a page.");
      process.exit(1);
    }

    const result = composePage({ hero, features, ctaBand, theme, title, output });

    if (output) {
      console.log(`\nPage written to: ${result.outputPath}`);
      console.log(`Size: ${result.size} bytes\n`);
    } else {
      console.log(result.html);
    }
    return;
  }

  console.error(`Unknown command: ${command}`);
  printUsage();
  process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = { composePage, loadPattern, listPatterns };
