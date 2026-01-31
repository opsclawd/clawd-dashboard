import { describe, it, expect } from 'vitest';
import { readJsonFile, writeJsonFile } from '../src/infrastructure/json-store';
import path from 'node:path';
import fs from 'node:fs';

describe('json-store', () => {
  it('writes and reads JSON files', () => {
    const file = path.join(process.cwd(), 'test-json-store.json');
    writeJsonFile(file, { ok: true });
    const data = readJsonFile(file, { ok: false });
    expect(data.ok).toBe(true);
    fs.rmSync(file, { force: true });
  });

  it('returns fallback on missing file', () => {
    const file = path.join(process.cwd(), 'missing-json-store.json');
    const data = readJsonFile(file, { ok: false });
    expect(data.ok).toBe(false);
  });
});
