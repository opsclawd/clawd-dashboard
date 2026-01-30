#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const DATA_PATH = path.resolve(process.cwd(), 'data/events.jsonl');

const [stream, type, summary] = process.argv.slice(2);
if (!stream || !type || !summary) {
  console.error('Usage: node scripts/log-event.mjs <stream> <type> <summary>');
  process.exit(1);
}

const ev = {
  ts: new Date().toISOString(),
  stream,
  type,
  summary
};

fs.appendFileSync(DATA_PATH, JSON.stringify(ev) + '\n', 'utf-8');
console.log('logged', ev);
