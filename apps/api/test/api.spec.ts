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

  it('PATCH /api/v1/tasks/:id updates status and logs event', async () => {
    const payload = {
      id: '44444444-4444-4444-4444-444444444444',
      ts: new Date().toISOString(),
      stream: 'dashboard',
      title: 'Patch task',
      status: 'next'
    };

    await request(app.server).post('/api/v1/tasks').send(payload);

    const patch = await request(app.server)
      .patch(`/api/v1/tasks/${payload.id}`)
      .send({ status: 'done' });
    expect(patch.status).toBe(200);
    expect(patch.body.item.status).toBe('done');

    const events = await request(app.server).get('/api/v1/events?type=task');
    expect(events.status).toBe(200);
    expect(events.body.items[0].summary).toContain('Task moved to done');
  });

  it('Saved filters API persists data', async () => {
    const filter = {
      name: 'phase2',
      stream: 'dashboard',
      type: 'plan',
      status: 'next',
      limit: 10,
      query: 'deploy'
    };

    const post = await request(app.server).post('/api/v1/saved-filters').send(filter);
    expect(post.status).toBe(200);

    const list = await request(app.server).get('/api/v1/saved-filters');
    expect(list.status).toBe(200);
    expect(list.body.items.some((item: any) => item.name === 'phase2')).toBe(true);

    const del = await request(app.server).delete('/api/v1/saved-filters/phase2');
    expect(del.status).toBe(200);
    const listAfter = await request(app.server).get('/api/v1/saved-filters');
    expect(listAfter.body.items.some((item: any) => item.name === 'phase2')).toBe(false);
  });

  it('Git endpoints expose commits and diffs', async () => {
    const commits = await request(app.server).get('/api/v1/git/commits?limit=1');
    expect(commits.status).toBe(200);
    expect(Array.isArray(commits.body.items)).toBe(true);
    const sha = commits.body.items[0].sha;

    const detail = await request(app.server).get(`/api/v1/git/commit/${sha}`);
    expect(detail.status).toBe(200);
    expect(detail.body.sha).toBe(sha);

    const diff = await request(app.server).get(`/api/v1/git/diff/${sha}?path=package.json`);
    expect(diff.status).toBe(200);
    expect(typeof diff.text).toBe('string');
  });

  it('Indexing + integrity endpoints', async () => {
    const rebuild = await request(app.server).post('/api/v1/index/rebuild');
    expect(rebuild.status).toBe(200);
    const tick = await request(app.server).post('/api/v1/index/tick');
    expect(tick.status).toBe(200);

    const indexed = await request(app.server).get('/api/v1/events?indexed=1');
    expect(indexed.status).toBe(200);

    const integrity = await request(app.server).get('/api/v1/integrity/check');
    expect(integrity.status).toBe(200);
  });

  it('Streams export CSV endpoints', async () => {
    const cannabisSave = await request(app.server)
      .post('/api/v1/streams/cannabis/checklist')
      .send({ items: [{ id: 'c1', title: 'Step', status: 'todo' }] });
    expect(cannabisSave.status).toBe(200);
    const cannabis = await request(app.server).get('/api/v1/streams/cannabis/checklist/export');
    expect(cannabis.status).toBe(200);

    const jobSave = await request(app.server)
      .post('/api/v1/streams/job-search/applications')
      .send({ items: [{ id: 'j1', company: 'Co', role: 'Dev', status: 'applied' }] });
    expect(jobSave.status).toBe(200);
    const job = await request(app.server).get('/api/v1/streams/job-search/applications/export');
    expect(job.status).toBe(200);

    const marketingSave = await request(app.server)
      .post('/api/v1/streams/marketing/campaigns')
      .send({ items: [{ id: 'm1', name: 'Campaign', status: 'idea' }] });
    expect(marketingSave.status).toBe(200);
    const marketing = await request(app.server).get('/api/v1/streams/marketing/campaigns/export');
    expect(marketing.status).toBe(200);
  });

  it('Digest + reminders + subscriptions endpoints', async () => {
    const daily = await request(app.server).get('/api/v1/digest/daily');
    expect(daily.status).toBe(200);

    const reminderBad = await request(app.server).post('/api/v1/reminders').send({ message: 'Missing fields' });
    expect(reminderBad.status).toBe(400);

    const reminder = await request(app.server).post('/api/v1/reminders').send({
      id: 'r2',
      message: 'Follow up',
      when: new Date().toISOString(),
      stream: 'dashboard'
    });
    expect(reminder.status).toBe(200);

    const subsBad = await request(app.server).post('/api/v1/digest/subscriptions').send({ channel: 'telegram' });
    expect(subsBad.status).toBe(400);

    const subs = await request(app.server).post('/api/v1/digest/subscriptions').send({
      channel: 'telegram',
      to: 'chat',
      enabled: true
    });
    expect(subs.status).toBe(200);
    const listSubs = await request(app.server).get('/api/v1/digest/subscriptions');
    expect(listSubs.status).toBe(200);

    const id = listSubs.body.items?.[0]?.id;
    if (id) {
      const del = await request(app.server).delete(`/api/v1/digest/subscriptions/${id}`);
      expect(del.status).toBe(200);
    }
  });

  it('GET /api/v1/artifacts returns items array', async () => {
    const res = await request(app.server).get('/api/v1/artifacts');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });
});
