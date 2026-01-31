import { describe, it, expect } from 'vitest';
import { DigestService } from '../src/application/digest';
import { EventRepository } from '../src/infrastructure/repositories/event-repository';
import { TaskRepository } from '../src/infrastructure/repositories/task-repository';
import path from 'node:path';
import fs from 'node:fs';

describe('DigestService', () => {
  it('summarizes events and tasks', () => {
    const root = path.join(process.cwd(), 'test-digest');
    fs.mkdirSync(path.join(root, 'data'), { recursive: true });
    const events = new EventRepository(path.join(root, 'data', 'events.jsonl'));
    const tasks = new TaskRepository(path.join(root, 'data', 'tasks.jsonl'));
    events.append({ id: 'e1', correlationId: 'c1', actor: 'clawd', severity: 'info', ts: new Date().toISOString(), stream: 'dashboard', type: 'plan', summary: 'Digest event' });
    tasks.append({ id: 't1', ts: new Date().toISOString(), stream: 'dashboard', status: 'done', title: 'Finished' });

    const svc = new DigestService(events, tasks);
    const digest = svc.daily();
    expect(digest.eventCount).toBe(1);
    expect(digest.tasksDone).toBe(1);

    fs.rmSync(root, { recursive: true, force: true });
  });
});
