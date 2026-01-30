import type { FastifyInstance } from 'fastify';
import { TaskService } from '../../application/tasks';

export const registerTaskRoutes = (fastify: FastifyInstance, taskService: TaskService) => {
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
};
