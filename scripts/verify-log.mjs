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

const lines = fs.readFileSync(filePath, 'utf-8').split('\n').filter(Boolean);
let prevHash = '';

const stableStringify = (input) => {
  if (input === null || typeof input !== 'object') return JSON.stringify(input);
  if (Array.isArray(input)) return `[${input.map((item) => stableStringify(item)).join(',')}]`;
  const entries = Object.entries(input)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `"${key}":${stableStringify(value)}`);
  return `{${entries.join(',')}}`;
};

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

for (let i = 0; i < lines.length; i += 1) {
  const event = JSON.parse(lines[i]);
  const expectedPrev = prevHash;
  const payload = { ...event };
  delete payload.hash;
  const canonical = stableStringify(payload);
  const expectedHash = sha256(`${expectedPrev}${canonical}`);

  if (event.prevHash !== expectedPrev || event.hash !== expectedHash) {
    console.error(`Hash mismatch at line ${i + 1}`);
    console.error({ expectedPrev, actualPrev: event.prevHash, expectedHash, actualHash: event.hash });
    process.exit(1);
  }
  prevHash = expectedHash;
}

console.log(`Verified ${lines.length} events. Hash chain OK.`);
