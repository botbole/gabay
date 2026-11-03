#!/usr/bin/env node
// Usage: node scripts/design-status.mjs [--check]
// Counts matching lines per rule in src/**/*.{ts,tsx}. --check exits 1 on any violation.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(ROOT, 'src');
const EXEMPT = new Set(['src/index.css']);

const RULES = [
  { id: 'hex', label: 'hex color', re: /#[0-9a-fA-F]{3,8}\b/ },
  { id: 'gray', label: 'raw gray/slate/zinc/stone', re: /\b(?:gray|slate|zinc|stone)-\d+/ },
  { id: 'physical', label: 'physical direction', re: /(?:^|[\s"'`:])-?(?:pl|pr|ml|mr)-(?:\d|\[|auto|px)|\b(?:text-left|text-right|flex-row-reverse|space-x-reverse)\b/ },
  { id: 'arbitrary', label: 'arbitrary color value', re: /bg-\[(?:#|var\()/ },
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
}

const check = process.argv.includes('--check');
const totals = Object.fromEntries(RULES.map(r => [r.id, 0]));
const rows = [];

for (const file of walk(SRC)) {
  const rel = relative(ROOT, file).split(sep).join('/');
  if (EXEMPT.has(rel)) continue;
  const counts = Object.fromEntries(RULES.map(r => [r.id, 0]));
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    for (const rule of RULES) if (rule.re.test(line)) counts[rule.id] += 1;
  }
  const sum = Object.values(counts).reduce((a, b) => a + b, 0);
  if (sum > 0) rows.push({ rel, counts, sum });
  for (const id of Object.keys(counts)) totals[id] += counts[id];
}

rows.sort((a, b) => b.sum - a.sum || a.rel.localeCompare(b.rel));
const header = ['file', ...RULES.map(r => r.id), 'total'];
const width = Math.max(4, ...rows.map(r => r.rel.length));
console.log([header[0].padEnd(width), ...header.slice(1).map(h => h.padStart(9))].join(' '));
for (const { rel, counts, sum } of rows) {
  console.log([rel.padEnd(width), ...RULES.map(r => String(counts[r.id]).padStart(9)), String(sum).padStart(9)].join(' '));
}
const grand = Object.values(totals).reduce((a, b) => a + b, 0);
console.log([''.padEnd(width, '-'), ...header.slice(1).map(() => '-'.repeat(9))].join(' '));
console.log(['TOTAL'.padEnd(width), ...RULES.map(r => String(totals[r.id]).padStart(9)), String(grand).padStart(9)].join(' '));
console.log(`\n${RULES.map(r => `${r.id}: ${r.label}`).join(' | ')}`);

if (check && grand > 0) {
  console.error(`\ndesign:check failed: ${grand} violating lines.`);
  process.exit(1);
}
