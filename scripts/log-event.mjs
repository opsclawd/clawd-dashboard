#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const DATA_PATH = path.resolve(process.cwd(), 'data/events.jsonl');
const VALID_SEVERITIES = ['info', 'warn', 'error'];

const [stream, type, summary, severityArg] = process.argv.slice(2);
if (!stream || !type || !summary) {
  console.error('Usage: node scripts/log-event.mjs <stream> <type> <summary> [severity]');
  process.exit(1);
}

const severity = VALID_SEVERITIES.includes(severityArg) ? severityArg : 'info';

const ev = {
  id: crypto.randomUUID(),
  correlationId: crypto.randomUUID(),
  actor: 'clawd',
  severity,
  ts: new Date().toISOString(),
  stream,
  type,
  summary
};

fs.appendFileSync(DATA_PATH, JSON.stringify(ev) + '\n', 'utf-8');
console.log('logged', ev);
