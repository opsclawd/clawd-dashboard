import Fastify from 'fastify';
import cors from '@fastify/cors';
import path from 'node:path';
import { ArtifactRepository } from '../infrastructure/repositories/artifact-repository';
import { EventRepository } from '../infrastructure/repositories/event-repository';
import { TaskRepository } from '../infrastructure/repositories/task-repository';
import { ArtifactService } from '../application/artifacts';
import { EventService } from '../application/events';
import { TaskService } from '../application/tasks';
import { registerRoutes } from '../interface/register-routes';

const ROOT = path.resolve(process.cwd(), '../../');
const EVENTS_PATH = path.join(ROOT, 'data/events.jsonl');
const TASKS_PATH = path.join(ROOT, 'data/tasks.jsonl');
const STREAMS_PATH = path.join(ROOT, 'streams');

export const startApi = async () => {
  const fastify = Fastify({ logger: true });

  const eventRepository = new EventRepository(EVENTS_PATH);
  const taskRepository = new TaskRepository(TASKS_PATH);
  const artifactRepository = new ArtifactRepository(ROOT, STREAMS_PATH);

  const eventService = new EventService(eventRepository);
  const taskService = new TaskService(taskRepository);
  const artifactService = new ArtifactService(artifactRepository);

  await fastify.register(cors, {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: false
  });

  registerRoutes(fastify, { eventService, taskService, artifactService });

  const port = Number(process.env.PORT ?? 5174);
  const host = process.env.HOST ?? '127.0.0.1';

  try {
    await fastify.listen({ port, host });
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
};
