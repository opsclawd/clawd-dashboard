import { describe, it, expect } from 'vitest';
import { IndexService } from '../src/application/indexer';
import { IndexReader } from '../src/application/index-reader';
import fs from 'node:fs';
import path from 'node:path';

describe('IndexService', () => {
  it('rebuilds and reads events from sqlite', () => {
    const root = path.join(process.cwd(), 'test-indexer');
    fs.mkdirSync(path.join(root, 'data'), { recursive: true });
    const eventsPath = path.join(root, 'data', 'events.jsonl');
    const tasksPath = path.join(root, 'data', 'tasks.jsonl');
    fs.writeFileSync(eventsPath, JSON.stringify({ id: 'e1', ts: new Date().toISOString(), stream: 'dashboard', type: 'plan', summary: 'hello' }) + '\n');
    fs.writeFileSync(tasksPath, JSON.stringify({ id: 't1', ts: new Date().toISOString(), stream: 'dashboard', status: 'done', title: 'task' }) + '\n');

    const svc = new IndexService(root);
    const res = svc.rebuild();
    expect(res.events).toBe(1);

    const status = svc.status();
    expect(status.lag.events).toBe(0);
    expect(status.dbCounts.events).toBe(1);
    const reader = new IndexReader(root);
    const list = reader.listEvents({ stream: 'dashboard', type: undefined, status: undefined, q: undefined, limit: 10, offset: 0 });
    expect(list.items.length).toBeGreaterThan(0);
    const filtered = reader.listEvents({ stream: 'dashboard', type: 'plan', status: undefined, q: 'hello', limit: 10, offset: 0 });
    expect(filtered.items.length).toBeGreaterThan(0);

    // Introduce lag.
    fs.appendFileSync(
      eventsPath,
      JSON.stringify({ id: 'e2', ts: new Date().toISOString(), stream: 'dashboard', type: 'plan', summary: 'later' }) + '\n'
    );
    const lagging = svc.status();
    expect(lagging.lag.events).toBeGreaterThan(0);

    fs.rmSync(root, { recursive: true, force: true });
  });
});
