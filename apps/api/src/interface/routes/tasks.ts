import type { FastifyInstance } from 'fastify';
import { TaskService } from '../../application/tasks';
import { EventService } from '../../application/events';

export const registerTaskRoutes = (
  fastify: FastifyInstance,
  taskService: TaskService,
  eventService: EventService
) => {
  fastify.get('/api/v1/tasks', async (req) => {
    const query = req.query as { stream?: string; status?: string };
    return taskService.listTasks(query);
  });

  fastify.post('/api/v1/tasks', async (req, res) => {
    const result = taskService.createTask(req.body);
    if (!result.success) {
      return res.status(400).send({ error: result.error });
    }
    return { ok: true };
  });

  // Phase 2: status transitions
  fastify.patch('/api/v1/tasks/:id', async (req, res) => {
    const params = req.params as { id: string };
    const body = req.body as { status?: string };
    if (!body?.status) return res.status(400).send({ error: 'Missing status' });

    const result = taskService.updateTaskStatus(params.id, body.status as any);
    if (!result.success) return res.status(404).send({ error: result.error });

    // Emit audit event
    eventService.createEvent({
      ts: new Date().toISOString(),
      stream: result.item.stream,
      type: 'task',
      summary: `Task moved to ${result.item.status}: ${result.item.title}`,
      details: { taskId: result.item.id, status: result.item.status }
    });

    return { ok: true, item: result.item };
  });
};
