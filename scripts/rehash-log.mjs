#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';

const root = process.cwd();
const filePath = path.join(root, 'data', 'events.jsonl');

if (!fs.existsSync(filePath)) {
  console.error('events.jsonl not found');
  process.exit(1);
}

const stableStringify = (input) => {
  if (input === null || typeof input !== 'object') return JSON.stringify(input);
  if (Array.isArray(input)) return `[${input.map((item) => stableStringify(item)).join(',')}]`;
  const entries = Object.entries(input)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `"${key}":${stableStringify(value)}`);
  return `{${entries.join(',')}}`;
};

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

const lines = fs.readFileSync(filePath, 'utf-8').split('\n').filter(Boolean);
let prevHash = '';
const output = [];

for (let i = 0; i < lines.length; i += 1) {
  const event = JSON.parse(lines[i]);

  // Recompute deterministically using the same rules as verify-log.mjs:
  // hash = sha256(prevHash + stableStringify(eventWithoutHash))
  const nextEvent = { ...event, prevHash };
  delete nextEvent.hash;

  const canonical = stableStringify(nextEvent);
  const hash = sha256(`${prevHash}${canonical}`);
  nextEvent.hash = hash;

  output.push(JSON.stringify(nextEvent));
  prevHash = hash;
}

// Write a backup next to the file for safety.
const backupPath = `${filePath}.bak`;
if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(filePath, backupPath);
}

fs.writeFileSync(filePath, `${output.join('\n')}\n`, 'utf-8');
console.log(`Rehashed ${output.length} events. Backup: ${backupPath}`);
