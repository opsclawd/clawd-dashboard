import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import fs from 'node:fs';
import path from 'node:path';

import { buildApp } from '../src/bootstrap/build-app';

const tmpRoot = path.join(process.cwd(), 'test-tmp');

describe('API integration', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    fs.mkdirSync(path.join(tmpRoot, 'data'), { recursive: true });
    fs.mkdirSync(path.join(tmpRoot, 'streams', 'dashboard'), { recursive: true });
    fs.writeFileSync(path.join(tmpRoot, 'data', 'events.jsonl'), '', 'utf-8');
    fs.writeFileSync(path.join(tmpRoot, 'data', 'tasks.jsonl'), '', 'utf-8');
    app = await buildApp({ rootDir: tmpRoot });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it('GET /health', async () => {
    const res = await request(app.server).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('POST /api/v1/events then GET /api/v1/events', async () => {
    const payload = {
      id: '11111111-1111-1111-1111-111111111111',
      correlationId: '22222222-2222-2222-2222-222222222222',
      ts: new Date().toISOString(),
      stream: 'dashboard',
      type: 'plan',
      summary: 'Test event',
      actor: 'clawd',
      severity: 'info'
    };

    const post = await request(app.server).post('/api/v1/events').send(payload);
    expect(post.status).toBe(200);

    const get = await request(app.server).get('/api/v1/events?limit=10&offset=0');
    expect(get.status).toBe(200);
    expect(get.body.total).toBe(1);
    expect(get.body.items[0].summary).toBe('Test event');
  });

  it('POST /api/v1/tasks then GET /api/v1/tasks', async () => {
    const payload = {
      id: '33333333-3333-3333-3333-333333333333',
      ts: new Date().toISOString(),
      stream: 'dashboard',
      title: 'Test task',
      status: 'backlog'
    };

    const post = await request(app.server).post('/api/v1/tasks').send(payload);
    expect(post.status).toBe(200);

    const get = await request(app.server).get('/api/v1/tasks');
    expect(get.status).toBe(200);
    expect(get.body.items[0].title).toBe('Test task');
  });

  it('GET /api/v1/artifacts returns items array', async () => {
    const res = await request(app.server).get('/api/v1/artifacts');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });
});
