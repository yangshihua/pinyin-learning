#!/usr/bin/env node

const fs = require('fs');

function validateA11y(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    info: []
  };

  const imgTags = html.match(/<img[^>]*>/g) || [];
  imgTags.forEach((img, index) => {
    if (!img.includes('alt=')) {
      results.errors.push(`Image ${index + 1} missing alt attribute: ${img.substring(0, 80)}...`);
      results.valid = false;
    }
  });

  const buttonTags = html.match(/<button[^>]*>[\s\S]*?<\/button>/g) || [];
  buttonTags.forEach((button, index) => {
    const hasText = button.match(/>([^<]+)</);
    const hasAriaLabel = button.includes('aria-label=');
    const hasAriaLabelledby = button.includes('aria-labelledby=');
    if (!hasText && !hasAriaLabel && !hasAriaLabelledby) {
      results.errors.push(`Button ${index + 1} has no accessible text`);
      results.valid = false;
    }
  });

  const inputTags = html.match(/<input[^>]*>/g) || [];
  inputTags.forEach((input, index) => {
    const typeMatch = input.match(/type="([^"]+)"/);
    const inputType = typeMatch ? typeMatch[1] : 'text';
    if (inputType === 'hidden') return;

    const hasId = input.match(/id="([^"]+)"/);
    if (hasId) {
      const id = hasId[1];
      const hasLabel = html.includes(`for="${id}"`);
      const hasAriaLabel = input.includes('aria-label=');
      const hasAriaLabelledby = input.includes('aria-labelledby=');
      if (!hasLabel && !hasAriaLabel && !hasAriaLabelledby) {
        results.warnings.push(`Input #${id} has no associated label`);
      }
    } else {
      const hasAriaLabel = input.includes('aria-label=');
      if (!hasAriaLabel) {
        results.warnings.push(`Input ${index + 1} (type=${inputType}) has no id or aria-label`);
      }
    }
  });

  const headings = [];
  for (let i = 1; i <= 6; i++) {
    const matches = html.match(new RegExp(`<h${i}[\\s>]`, 'g')) || [];
    matches.forEach(() => headings.push(i));
  }

  if (headings.length === 0) {
    results.warnings.push('No heading elements found');
  } else {
    for (let i = 1; i < headings.length; i++) {
      if (headings[i] - headings[i - 1] > 1) {
        results.warnings.push(`Heading hierarchy skip: h${headings[i - 1]} to h${headings[i]}`);
      }
    }
  }

  if (!html.includes('lang=')) {
    results.warnings.push('Missing lang attribute on html tag');
  }

  const hasMain = html.includes('<main');
  if (!hasMain) {
    results.warnings.push('No <main> landmark found');
  }

  const hasNav = html.includes('<nav');
  if (!hasNav) {
    results.info.push('Consider adding a <nav> element for navigation');
  }

  const ariaCount = (html.match(/aria-/g) || []).length;
  const roleCount = (html.match(/role=/g) || []).length;
  results.info.push(`Found ${imgTags.length} images`);
  results.info.push(`Found ${buttonTags.length} buttons`);
  results.info.push(`Found ${inputTags.length} inputs`);
  results.info.push(`Found ${headings.length} headings`);
  results.info.push(`Found ${ariaCount} aria attributes, ${roleCount} role attributes`);

  return results;
}

function printReport(filePath, results) {
  console.log('\n=== Accessibility Validation Report ===\n');
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
    console.error('Usage: node validate-a11y.js <file.html>');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const results = validateA11y(filePath);
  printReport(filePath, results);
  process.exit(results.valid ? 0 : 1);
}

module.exports = { validateA11y };
