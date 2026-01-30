import type { FastifyInstance } from 'fastify';
import { ArtifactService } from '../application/artifacts';
import { EventService } from '../application/events';
import { GitService } from '../application/git';
import { TaskService } from '../application/tasks';
import { registerArtifactRoutes } from './routes/artifacts';
import { registerEventRoutes } from './routes/events';
import { registerGitRoutes } from './routes/git';
import { registerHealthRoute } from './routes/health';
import { registerSavedFilterRoutes } from './routes/saved-filters';
import { registerTaskRoutes } from './routes/tasks';

export const registerRoutes = (
  fastify: FastifyInstance,
  deps: {
    eventService: EventService;
    taskService: TaskService;
    artifactService: ArtifactService;
    gitService: GitService;
    savedFilterService: import('../application/saved-filters').SavedFilterService;
  }
) => {
  registerHealthRoute(fastify);
  registerEventRoutes(fastify, deps.eventService);
  registerTaskRoutes(fastify, deps.taskService, deps.eventService);
  registerArtifactRoutes(fastify, deps.artifactService, deps.gitService);
  registerGitRoutes(fastify, deps.gitService);
  registerSavedFilterRoutes(fastify, deps.savedFilterService);
};
