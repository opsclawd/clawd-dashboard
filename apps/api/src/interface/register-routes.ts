import type { FastifyInstance } from 'fastify';
import { ArtifactService } from '../application/artifacts';
import { EventService } from '../application/events';
import { GitService } from '../application/git';
import { TaskService } from '../application/tasks';
import { registerArtifactRoutes } from './routes/artifacts';
import { registerEventRoutes } from './routes/events';
import { registerGitRoutes } from './routes/git';
import { registerHealthRoute } from './routes/health';
import { registerIndexerRoutes } from './routes/indexer';
import { registerSavedFilterRoutes } from './routes/saved-filters';
import { registerAutomationRoutes } from './routes/automation';
import { registerIntegrityRoutes } from './routes/integrity';
import { registerStreamRoutes } from './routes/streams';
import { registerTaskRoutes } from './routes/tasks';

export const registerRoutes = (
  fastify: FastifyInstance,
  deps: {
    eventService: EventService;
    taskService: TaskService;
    artifactService: ArtifactService;
    gitService: GitService;
    savedFilterService: import('../application/saved-filters').SavedFilterService;
    indexService: import('../application/indexer').IndexService;
    streamService: import('../application/streams').StreamService;
    digestService: import('../application/digest').DigestService;
    reminderService: import('../application/reminders').ReminderService;
  }
) => {
  registerHealthRoute(fastify);
  registerEventRoutes(fastify, deps.eventService);
  registerTaskRoutes(fastify, deps.taskService, deps.eventService);
  registerArtifactRoutes(fastify, deps.artifactService, deps.gitService);
  registerGitRoutes(fastify, deps.gitService);
  registerSavedFilterRoutes(fastify, deps.savedFilterService);
  registerIndexerRoutes(fastify, deps.indexService);
  registerStreamRoutes(fastify, deps.streamService);
  registerAutomationRoutes(fastify, deps.digestService, deps.reminderService);
  registerIntegrityRoutes(fastify, process.cwd());
};
