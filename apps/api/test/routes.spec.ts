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

describe('registerRoutes', () => {
  it('registers all expected endpoints', async () => {
    const fastify = Fastify();
    registerRoutes(fastify, {
      eventService: new EventService(new EventRepository('')),
      taskService: new TaskService(new TaskRepository('')),
      artifactService: new ArtifactService(new ArtifactRepository('', '')),
      gitService: new GitService(new GitRepository(process.cwd())),
      savedFilterService: new SavedFilterService(new SavedFilterRepository(''))
    });
    await fastify.ready();
    const routes = fastify.printRoutes();
    expect(routes).toContain('saved-filters');
    expect(routes).toContain('git');
    await fastify.close();
  });
});
