import { describe, it, expect } from 'vitest';
import { ReminderService } from '../src/application/reminders';
import { EventService } from '../src/application/events';
import { TaskService } from '../src/application/tasks';
import { EventRepository } from '../src/infrastructure/repositories/event-repository';
import { TaskRepository } from '../src/infrastructure/repositories/task-repository';
import path from 'node:path';
import fs from 'node:fs';

describe('ReminderService', () => {
  it('persists reminder and logs event', () => {
    const base = path.join(process.cwd(), 'test-reminders');
    const apiDir = path.join(base, 'apps', 'api');
    const dataDir = path.join(base, 'data');
    fs.mkdirSync(apiDir, { recursive: true });
    fs.mkdirSync(dataDir, { recursive: true });

    const cwd = process.cwd();
    process.chdir(apiDir);

    const events = new EventService(new EventRepository(path.join(dataDir, 'events.jsonl')));
    const tasks = new TaskService(new TaskRepository(path.join(dataDir, 'tasks.jsonl')));
    const svc = new ReminderService(events, tasks);
    svc.create({ id: 'r1', message: 'Ping', when: new Date().toISOString(), stream: 'dashboard' });

    const stored = JSON.parse(fs.readFileSync(path.join(dataDir, 'reminders.json'), 'utf-8'));
    expect(stored.length).toBe(1);

    process.chdir(cwd);
    fs.rmSync(base, { recursive: true, force: true });
  });
});
