import { describe, it, expect } from 'vitest';
import { verifyLogIntegrity } from '../src/application/integrity';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

describe('Integrity verification', () => {
  it('verifies hash chain for temp log', () => {
    const repoRoot = path.resolve(process.cwd(), '../..');
    const root = path.join(repoRoot, 'apps', 'api', 'test-integrity');
    fs.mkdirSync(path.join(root, 'data'), { recursive: true });
    fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
    fs.copyFileSync(path.join(repoRoot, 'scripts', 'hash-log.mjs'), path.join(root, 'scripts', 'hash-log.mjs'));
    fs.copyFileSync(path.join(repoRoot, 'scripts', 'verify-log.mjs'), path.join(root, 'scripts', 'verify-log.mjs'));

    const eventPath = path.join(root, 'data', 'events.jsonl');
    fs.writeFileSync(eventPath, JSON.stringify({ id: 'e1', ts: new Date().toISOString(), stream: 'dashboard', type: 'plan', summary: 'hello' }) + '\n');

    // hash log using local script copy
    spawnSync('node', [path.join(root, 'scripts', 'hash-log.mjs')], { cwd: root, encoding: 'utf-8' });
    const res = verifyLogIntegrity(root);
    expect(res.ok).toBe(true);
    fs.rmSync(root, { recursive: true, force: true });
  });
});
