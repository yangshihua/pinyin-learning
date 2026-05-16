#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function validateTokens(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    info: []
  };

  const hasCSSVariables = html.includes('var(--');
  if (hasCSSVariables) {
    const varMatches = html.match(/var\(--[a-zA-Z0-9-]+\)/g) || [];
    const uniqueVars = [...new Set(varMatches)];
    results.info.push(`Using ${uniqueVars.length} unique CSS variables`);
    uniqueVars.forEach(v => results.info.push(`  ${v}`));
  } else {
    results.warnings.push('No CSS variables (var(--)) found');
  }

  const hexColors = html.match(/(?!<)#[0-9a-fA-F]{3,8}(?![0-9a-fA-F])/g) || [];
  const hexInStyle = [];
  const styleMatches = html.match(/<style[\s\S]*?<\/style>/g) || [];
  styleMatches.forEach(styleBlock => {
    const blockHexes = styleBlock.match(/#[0-9a-fA-F]{3,8}(?![0-9a-fA-F;])/g) || [];
    blockHexes.forEach(h => hexInStyle.push(h));
  });

  if (hexInStyle.length > 0) {
    results.warnings.push(`Found ${hexInStyle.length} hardcoded hex colors in inline styles: ${[...new Set(hexInStyle)].join(', ')}`);
  }

  const rgbColors = html.match(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+/g) || [];
  const rgbInStyle = [];
  styleMatches.forEach(styleBlock => {
    const blockRgbs = styleBlock.match(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+/g) || [];
    blockRgbs.forEach(r => rgbInStyle.push(r));
  });
  if (rgbInStyle.length > 0) {
    results.warnings.push(`Found ${rgbInStyle.length} hardcoded rgb/rgba colors in inline styles`);
  }

  const hasTokensCSS = html.includes('tokens.css');
  if (hasTokensCSS) {
    results.info.push('tokens.css is linked in the document');
  } else {
    results.errors.push('tokens.css is not linked in the document');
    results.valid = false;
  }

  const hasStylesCSS = html.includes('styles.css');
  if (hasStylesCSS) {
    results.info.push('styles.css is linked in the document');
  } else {
    results.warnings.push('styles.css is not linked in the document');
  }

  const inlineStyleCount = (html.match(/style="/g) || []).length;
  if (inlineStyleCount > 10) {
    results.warnings.push(`Excessive inline styles: ${inlineStyleCount} found. Prefer CSS classes.`);
  } else if (inlineStyleCount > 0) {
    results.info.push(`${inlineStyleCount} inline style attributes found`);
  }

  const knownTokens = [
    '--color-bg-page', '--color-surface-glass-start', '--color-surface-glass-end',
    '--color-surface-card', '--color-line-soft', '--color-text-primary',
    '--color-text-muted', '--color-accent', '--color-accent-soft',
    '--color-accent-strong', '--radius-xl', '--radius-lg', '--radius-md',
    '--space-section', '--space-gap-lg', '--space-gap-md',
    '--shadow-soft', '--shadow-strong', '--motion-ease-standard',
    '--font-body', '--font-display', '--font-accent'
  ];

  let tokenCoverage = 0;
  knownTokens.forEach(token => {
    if (html.includes(`var(${token})`) || html.includes(token)) {
      tokenCoverage++;
    }
  });

  results.info.push(`Design token coverage: ${tokenCoverage}/${knownTokens.length} known tokens referenced`);

  return results;
}

function printReport(filePath, results) {
  console.log('\n=== Design Tokens Validation Report ===\n');
  console.log(`File: ${filePath}`);
  console.log(`Valid: ${results.valid ? '\u2713' : '\u2717'}\n`);

  if (results.errors.length > 0) {
    console.log('Errors:');
    results.errors.forEach(err => console.log(`  \u2717 ${err}`));
    console.log('');
  }

  if (results.warnings.length > 0) {
    console.log('Warnings:');
    results.warnings.forEach(warn => console.log(`  \u26A0 ${warn}`));
    console.log('');
  }

  if (results.info.length > 0) {
    console.log('Info:');
    results.info.forEach(info => console.log(`  \u2139 ${info}`));
    console.log('');
  }
}

if (require.main === module) {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error('Usage: node validate-tokens.js <file.html>');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const results = validateTokens(filePath);
  printReport(filePath, results);
  process.exit(results.valid ? 0 : 1);
}

module.exports = { validateTokens };
