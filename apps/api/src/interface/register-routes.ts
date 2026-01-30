import type { FastifyInstance } from 'fastify';
import { ArtifactService } from '../application/artifacts';
import { EventService } from '../application/events';
import { TaskService } from '../application/tasks';
import { registerArtifactRoutes } from './routes/artifacts';
import { registerEventRoutes } from './routes/events';
import { registerHealthRoute } from './routes/health';
import { registerTaskRoutes } from './routes/tasks';

export const registerRoutes = (
  fastify: FastifyInstance,
  deps: { eventService: EventService; taskService: TaskService; artifactService: ArtifactService }
) => {
  registerHealthRoute(fastify);
  registerEventRoutes(fastify, deps.eventService);
  registerTaskRoutes(fastify, deps.taskService);
  registerArtifactRoutes(fastify, deps.artifactService);
};
