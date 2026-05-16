#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function validateHTML(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    info: []
  };

  if (!html.includes('<!DOCTYPE html>')) {
    results.errors.push('Missing DOCTYPE declaration');
    results.valid = false;
  }

  const semanticTags = ['main', 'section', 'article', 'header', 'footer', 'nav'];
  const hasSemanticTags = semanticTags.some(tag => html.includes(`<${tag}`));
  if (!hasSemanticTags) {
    results.warnings.push('No semantic HTML5 tags found');
  }

  if (!html.includes('name="viewport"')) {
    results.errors.push('Missing viewport meta tag');
    results.valid = false;
  }

  if (!html.includes('charset=')) {
    results.errors.push('Missing charset meta tag');
    results.valid = false;
  }

  if (!html.includes('data-theme=')) {
    results.warnings.push('Missing data-theme attribute');
  }

  const aetherPaneClasses = [
    'page-hero', 'hero-grid', 'hero-panel', 'glass',
    'card-row', 'card-grid', 'stacked-cards', 'section',
    'story-card', 'principle-card', 'cta-band', 'metric-row',
    'panel-grid', 'dashboard-shell', 'settings-layout',
    'showcase-layout', 'display-frame', 'timeline-strip'
  ];
  const usedClasses = aetherPaneClasses.filter(cls => html.includes(cls));
  if (usedClasses.length === 0) {
    results.warnings.push('No AetherPane component classes found');
  } else {
    results.info.push(`Using ${usedClasses.length} AetherPane components: ${usedClasses.join(', ')}`);
  }

  const sectionCount = (html.match(/<section/g) || []).length;
  const mainCount = (html.match(/<main/g) || []).length;
  const articleCount = (html.match(/<article/g) || []).length;
  results.info.push(`Sections: ${sectionCount}, Main elements: ${mainCount}, Articles: ${articleCount}`);

  if (sectionCount === 0 && mainCount === 0) {
    results.warnings.push('Page has no section or main elements - may be incomplete');
  }

  if (!html.includes('lang=')) {
    results.warnings.push('Missing lang attribute on html tag');
  }

  return results;
}

function printReport(filePath, results) {
  console.log('\n=== HTML Validation Report ===\n');
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
    console.error('Usage: node validate-html.js <file.html>');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const results = validateHTML(filePath);
  printReport(filePath, results);
  process.exit(results.valid ? 0 : 1);
}

module.exports = { validateHTML };
