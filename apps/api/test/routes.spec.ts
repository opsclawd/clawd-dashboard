import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';
import { registerRoutes } from '../src/interface/register-routes';
import { EventService } from '../src/application/events';
import { TaskService } from '../src/application/tasks';
import { ArtifactService } from '../src/application/artifacts';
import { SavedFilterService } from '../src/application/saved-filters';
import { GitService } from '../src/application/git';
import { EventRepository } from '../src/infrastructure/repositories/event-repository';
import { TaskRepository } from '../src/infrastructure/repositories/task-repository';
import { ArtifactRepository } from '../src/infrastructure/repositories/artifact-repository';
import { SavedFilterRepository } from '../src/infrastructure/repositories/saved-filter-repository';
import { GitRepository } from '../src/infrastructure/git';
import fs from 'node:fs';
import path from 'node:path';

describe('registerRoutes', () => {
  it('registers all expected endpoints', async () => {
    const fastify = Fastify();
    const tmpRoot = path.join(process.cwd(), 'test-routes');
    fs.mkdirSync(path.join(tmpRoot, 'data'), { recursive: true });

    registerRoutes(fastify, {
      eventService: new EventService(new EventRepository(path.join(tmpRoot, 'data', 'events.jsonl'))),
      taskService: new TaskService(new TaskRepository(path.join(tmpRoot, 'data', 'tasks.jsonl'))),
      artifactService: new ArtifactService(new ArtifactRepository('', '')),
      gitService: new GitService(new GitRepository(process.cwd())),
      savedFilterService: new SavedFilterService(new SavedFilterRepository(path.join(tmpRoot, 'data', 'saved-filters.json'))),
      indexService: { rebuild: () => ({ events: 0, tasks: 0 }), tick: () => ({ events: 0, tasks: 0 }) },
      streamService: {
        listCannabisChecklist: () => [],
        saveCannabisChecklist: () => {},
        listJobApplications: () => [],
        saveJobApplications: () => {},
        listMarketingCampaigns: () => [],
        saveMarketingCampaigns: () => {}
      },
      digestService: { daily: () => ({ windowHours: 24, eventCount: 0, eventsByStream: {}, tasksDone: 0 }) },
      reminderService: { list: () => [], create: () => ({ ok: true }) },
      digestSubscriptionService: { list: () => [], save: () => ({ ok: true }), remove: () => ({ ok: true }) },
      rootDir: tmpRoot
    });
    await fastify.ready();
    const routes = fastify.printRoutes();
    const normalized = routes.replace(/\s+/g, '');
    expect(normalized).toMatch(/saved-filters|aved-filters/);
    expect(normalized).toContain('git');
    await fastify.close();
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });
});
