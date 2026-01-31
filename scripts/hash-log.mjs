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

const stableStringify = (input) => {
  if (input === null || typeof input !== 'object') return JSON.stringify(input);
  if (Array.isArray(input)) return `[${input.map((item) => stableStringify(item)).join(',')}]`;
  const entries = Object.entries(input)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `"${key}":${stableStringify(value)}`);
  return `{${entries.join(',')}}`;
};

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

let prevHash = '';
const nextLines = lines.map((line) => {
  const event = JSON.parse(line);
  const { hash, prevHash: _prev, ...rest } = event;
  const canonical = stableStringify({ ...rest, prevHash });
  const nextHash = sha256(`${prevHash}${canonical}`);
  const nextEvent = { ...rest, prevHash, hash: nextHash };
  prevHash = nextHash;
  return JSON.stringify(nextEvent);
});

fs.writeFileSync(filePath, nextLines.join('\n') + '\n', 'utf-8');
console.log(`Hashed ${nextLines.length} events.`);
