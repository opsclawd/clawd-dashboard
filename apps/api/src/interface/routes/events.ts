import type { FastifyInstance } from 'fastify';
import { EventService } from '../../application/events';

export const registerEventRoutes = (fastify: FastifyInstance, eventService: EventService) => {
  fastify.get('/api/v1/events', async (req) => {
    const query = req.query as { stream?: string; type?: string; status?: string };
    return eventService.listEvents(query);
  });

  fastify.post('/api/v1/events', async (req, res) => {
    const result = eventService.createEvent(req.body);
    if (!result.success) {
      return res.status(400).send({ error: result.error });
    }
    return { ok: true };
  });
};
