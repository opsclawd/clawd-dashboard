import Fastify from 'fastify';
import cors from '@fastify/cors';
import path from 'node:path';

import { ArtifactRepository } from '../infrastructure/repositories/artifact-repository';
import { EventRepository } from '../infrastructure/repositories/event-repository';
import { TaskRepository } from '../infrastructure/repositories/task-repository';

import { ArtifactService } from '../application/artifacts';
import { EventService } from '../application/events';
import { TaskService } from '../application/tasks';
import { SavedFilterService } from '../application/saved-filters';

import { registerRoutes } from '../interface/register-routes';
import { GitRepository } from '../infrastructure/git';
import { GitService } from '../application/git';
import { SavedFilterRepository } from '../infrastructure/repositories/saved-filter-repository';
import { IndexService } from '../application/indexer';

export type AppDeps = {
  rootDir?: string;
};

export const buildApp = async (deps: AppDeps = {}) => {
  const fastify = Fastify({ logger: false });

  const ROOT = deps.rootDir ?? path.resolve(process.cwd(), '../../');
  const EVENTS_PATH = path.join(ROOT, 'data/events.jsonl');
  const TASKS_PATH = path.join(ROOT, 'data/tasks.jsonl');
  const STREAMS_PATH = path.join(ROOT, 'streams');
  const SAVED_FILTERS_PATH = path.join(ROOT, 'data/saved-filters.json');

  const eventRepository = new EventRepository(EVENTS_PATH);
  const taskRepository = new TaskRepository(TASKS_PATH);
  const artifactRepository = new ArtifactRepository(ROOT, STREAMS_PATH);
  const gitRepository = new GitRepository(ROOT);
  const savedFilterRepository = new SavedFilterRepository(SAVED_FILTERS_PATH);
  const indexService = new IndexService(ROOT);

  const eventService = new EventService(eventRepository);
  const taskService = new TaskService(taskRepository);
  const artifactService = new ArtifactService(artifactRepository);
  const gitService = new GitService(gitRepository);
  const savedFilterService = new SavedFilterService(savedFilterRepository);

  await fastify.register(cors, {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: false
  });

  registerRoutes(fastify, { eventService, taskService, artifactService, gitService, savedFilterService, indexService });

  return fastify;
};
