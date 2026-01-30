#!/usr/bin/env node
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(process.cwd());
const LOG_PATH = path.join(ROOT, 'data', 'events.jsonl');
const TERMINAL_LOG = path.join(ROOT, 'terminal.log');

const [stream, ...cmdParts] = process.argv.slice(2);
if (!stream || cmdParts.length === 0) {
  console.error('Usage: node scripts/run.mjs <stream> <command...>');
  process.exit(1);
}

const command = cmdParts.join(' ');
const correlationId = crypto.randomUUID();
const now = () => new Date().toISOString();

const append = (event) => {
  fs.appendFileSync(LOG_PATH, JSON.stringify(event) + '\n', 'utf-8');
};

append({
  id: crypto.randomUUID(),
  correlationId,
  ts: now(),
  stream,
  type: 'command',
  severity: 'info',
  actor: 'clawd',
  summary: `START: ${command}`
});

const proc = spawn(command, { shell: true, stdio: 'pipe' });
const logStream = fs.createWriteStream(TERMINAL_LOG, { flags: 'a' });

proc.stdout.on('data', (chunk) => {
  process.stdout.write(chunk);
  logStream.write(chunk);
});

proc.stderr.on('data', (chunk) => {
  process.stderr.write(chunk);
  logStream.write(chunk);
});

proc.on('close', (code) => {
  append({
    id: crypto.randomUUID(),
    correlationId,
    ts: now(),
    stream,
    type: 'command',
    severity: code === 0 ? 'info' : 'error',
    actor: 'clawd',
    summary: `END(${code}): ${command}`,
    details: { exitCode: code }
  });
  logStream.end();
  process.exit(code ?? 1);
});
