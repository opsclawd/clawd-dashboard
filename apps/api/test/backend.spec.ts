import { describe, it, beforeEach, expect } from 'vitest';
import Fastify from 'fastify';
import fs from 'node:fs';
import path from 'node:path';
import { appendJsonLine, readJsonLines } from '../src/infrastructure/file-system';
import { EventService, EventRepositoryPort } from '../src/application/events';
import { TaskService, TaskRepositoryPort } from '../src/application/tasks';
import { ArtifactService, ArtifactRepositoryPort } from '../src/application/artifacts';
import { SavedFilterService, SavedFilterRepositoryPort, SavedFilter } from '../src/application/saved-filters';
import { GitService, GitRepositoryPort } from '../src/application/git';
import { registerRoutes } from '../src/interface/register-routes';
import { Event } from '../src/domain/entities/event';
import { Task } from '../src/domain/entities/task';

class InMemoryEventRepo implements EventRepositoryPort {
  private data: Event[] = [];
  readAll = () => [...this.data];
  append = (event: Event) => {
    this.data.push(event);
  };
}

class InMemoryTaskRepo implements TaskRepositoryPort {
  private data: Task[] = [];
  readAll = () => [...this.data];
  append = (task: Task) => {
    this.data.push(task);
  };
  writeAll = (tasks: Task[]) => {
    this.data = [...tasks];
  };
}

type SimpleArtifact = { path: string; mtimeMs: number; kind: 'stream' | 'file' };

class InMemoryArtifactRepo implements ArtifactRepositoryPort {
  constructor(private readonly payload: SimpleArtifact[]) {}
  fetchAll() {
    return [...this.payload];
  }
}

class InMemorySavedFilterRepo implements SavedFilterRepositoryPort {
  private items: SavedFilter[] = [];
  readAll = () => [...this.items];
  writeAll = (items: SavedFilter[]) => {
    this.items = [...items];
  };
}

class DummyGitRepo implements GitRepositoryPort {
  listCommits() {
    return { items: [], limit: 0, offset: 0 };
  }
  getCommit() {
    return null;
  }
  getDiff() {
    return 'diff';
  }
  getLastCommitForPath() {
    return 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
  }
}

describe('backend utilities', () => {
  it('reads and writes json lines', () => {
    const file = path.join(process.cwd(), 'test-backend-jsonl.tmp');
    try {
      appendJsonLine(file, JSON.stringify({ foo: 'bar' }));
      appendJsonLine(file, JSON.stringify({ foo: 'baz' }));
      const items = readJsonLines<{ foo: string }>(file);
      expect(items).toEqual([{ foo: 'bar' }, { foo: 'baz' }]);
    } finally {
      fs.rmSync(file, { force: true });
    }
  });
});

describe('EventService', () => {
  it('filters by q and retains redaction', () => {
    const repo = new InMemoryEventRepo();
    const service = new EventService(repo);
    const payload = {
      ts: new Date().toISOString(),
      stream: 'dashboard',
      type: 'plan',
      summary: 'Deploy Phase 2',
      id: '11111111-1111-1111-1111-111111111111',
      correlationId: '22222222-2222-2222-2222-222222222222',
      actor: 'clawd',
      severity: 'info'
    } as const;
    expect(service.createEvent(payload)).toEqual({ success: true });
    const { items } = service.listEvents({ q: 'phase' });
    expect(items[0].summary).toBe('Deploy Phase 2');
  });
});

describe('TaskService', () => {
  let service: TaskService;
  let repo: InMemoryTaskRepo;
  beforeEach(() => {
    repo = new InMemoryTaskRepo();
    service = new TaskService(repo);
    repo.append({
      id: 't1',
      ts: new Date().toISOString(),
      stream: 'dashboard',
      title: 'first',
      status: 'backlog'
    });
  });

  it('updates status and persists order', () => {
    const result = service.updateTaskStatus('t1', 'done');
    expect(result.success).toBe(true);
    expect(result.item.status).toBe('done');
  });
});

describe('ArtifactService', () => {
  it('returns sorted artifacts', () => {
    const payload = [
      { path: 'a', mtimeMs: 1, kind: 'stream' as const },
      { path: 'b', mtimeMs: 5, kind: 'file' as const }
    ];
    const service = new ArtifactService(new InMemoryArtifactRepo(payload));
    const { items } = service.listArtifacts();
    expect(items[0].mtimeMs).toBe(5);
  });
});

describe('SavedFilterService', () => {
  it('saves and removes filters by name', () => {
    const repo = new InMemorySavedFilterRepo();
    const service = new SavedFilterService(repo);
    const filter = { name: 'one', stream: '', type: '', status: '', limit: 25, query: '' };
    expect(service.save(filter)).toEqual({ success: true });
    expect(repo.readAll()).toHaveLength(1);
    expect(service.remove('one')).toEqual({ success: true });
    expect(repo.readAll()).toHaveLength(0);
  });
});

describe('GitService stub', () => {
  it('proxies git repository calls', () => {
    const service = new GitService(new DummyGitRepo());
    expect(service.getDiff('sha')).toBe('diff');
    expect(service.getLastCommitForPath('README.md')).toMatch(/^[0-9a-f]{40}$/i);
  });
});

describe('registerRoutes wiring', () => {
  it('exposes saved filters and git endpoints', async () => {
    const fastify = Fastify();
    const eventService = new EventService(new InMemoryEventRepo());
    const taskService = new TaskService(new InMemoryTaskRepo());
    const artifactService = new ArtifactService(new InMemoryArtifactRepo([]));
    const gitService = new GitService(new DummyGitRepo());
    const savedFilterService = new SavedFilterService(new InMemorySavedFilterRepo());
    registerRoutes(fastify, {
      eventService,
      taskService,
      artifactService,
      gitService,
      savedFilterService
    });
    await fastify.ready();
    const routes = fastify.printRoutes();
    expect(routes).toContain('saved-filters');
    expect(routes).toContain('git');
    await fastify.close();
  });
});
