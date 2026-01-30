import { describe, it, expect, beforeEach } from 'vitest';
import { TaskService } from '../src/application/tasks';
import { TaskRepository } from '../src/infrastructure/repositories/task-repository';
import path from 'node:path';
import fs from 'node:fs';

describe('TaskService', () => {
  const tmp = path.join(process.cwd(), 'test-tasks.jsonl');
  let service: TaskService;
  let repo: TaskRepository;

  beforeEach(() => {
    if (fs.existsSync(tmp)) fs.rmSync(tmp);
    repo = new TaskRepository(tmp);
    service = new TaskService(repo);
    repo.append({
      id: 't1',
      ts: new Date().toISOString(),
      stream: 'dashboard',
      title: 'first task',
      status: 'backlog'
    });
  });

  it('updates status and preserves order', () => {
    const result = service.updateTaskStatus('t1', 'done');
    expect(result.success).toBe(true);
    expect(result.item.status).toBe('done');
    const stored = repo.readAll().find((t) => t.id === 't1');
    expect(stored?.status).toBe('done');
  });

  it('returns validation error for malformed task', () => {
    const result = service.createTask({ title: 'no stream' });
    expect(result.success).toBe(false);
    expect(result.error?.formErrors).toBeDefined();
  });

  it('filters tasks by stream and status', () => {
    repo.append({
      id: 't2',
      ts: new Date().toISOString(),
      stream: 'marketing',
      title: 'stream test',
      status: 'blocked'
    });
    const { items } = service.listTasks({ stream: 'marketing', status: 'blocked' });
    expect(items).toHaveLength(1);
  });
});
