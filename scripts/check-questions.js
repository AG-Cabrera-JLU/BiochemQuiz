#!/usr/bin/env node
// Validates that all three language question files are in sync and follow naming conventions.
// Exit 0 = clean. Exit 1 = errors found.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FILES = {
  en: path.join(ROOT, 'questions.json'),
  de: path.join(ROOT, 'questions.de.json'),
  es: path.join(ROOT, 'questions.es.json'),
};

let errors = 0;

function err(msg) {
  console.error('  ERROR:', msg);
  errors++;
}

// Load all three files
const data = {};
for (const [lang, file] of Object.entries(FILES)) {
  try {
    data[lang] = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.error(`Failed to parse ${file}: ${e.message}`);
    process.exit(1);
  }
}

// Build ID sets per language
const ids = {};
for (const [lang, d] of Object.entries(data)) {
  ids[lang] = new Set(d.questions.map(q => q.id));
}

console.log('Checking question sync across EN / DE / ES...\n');

// 1. ID presence across all three files
const allIds = new Set([...ids.en, ...ids.de, ...ids.es]);
for (const id of [...allIds].sort()) {
  const missing = Object.entries(ids).filter(([, set]) => !set.has(id)).map(([lang]) => lang);
  if (missing.length) {
    err(`ID "${id}" missing in: ${missing.join(', ')}`);
  }
}

// 3. Image naming convention: explainImg must be "" or "images/{id}.{ext}"
for (const [lang, d] of Object.entries(data)) {
  for (const q of d.questions) {
    if (!q.explainImg) continue;
    const expected = new RegExp(`^images/${q.id}\\.[a-z]+$`);
    if (!expected.test(q.explainImg)) {
      err(`[${lang}] "${q.id}".explainImg = "${q.explainImg}" — expected "images/${q.id}.{ext}" or ""`);
    }
  }
}

// 4. Check referenced image files exist on disk
const checked = new Set();
for (const d of Object.values(data)) {
  for (const q of d.questions) {
    if (!q.explainImg || checked.has(q.explainImg)) continue;
    checked.add(q.explainImg);
    const imgPath = path.join(ROOT, q.explainImg);
    if (!fs.existsSync(imgPath)) {
      err(`Image file not found on disk: ${q.explainImg}`);
    }
  }
}

if (errors === 0) {
  console.log('All checks passed.');
  process.exit(0);
} else {
  console.error(`\n${errors} error(s) found. Fix before committing.`);
  process.exit(1);
}
