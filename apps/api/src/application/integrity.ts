import { spawnSync } from 'node:child_process';
import path from 'node:path';

export type IntegrityResult = {
  ok: boolean;
  message: string;
};

export const verifyLogIntegrity = (rootDir: string): IntegrityResult => {
  const script = path.join(rootDir, 'scripts', 'verify-log.mjs');
  const res = spawnSync('node', [script], { encoding: 'utf-8', cwd: rootDir });
  if (res.status === 0) {
    return { ok: true, message: (res.stdout || '').trim() || 'OK' };
  }
  return { ok: false, message: (res.stderr || res.stdout || '').trim() || 'Verification failed' };
};
