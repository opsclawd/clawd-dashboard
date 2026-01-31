import type { FastifyInstance } from 'fastify';
import { EventService } from '../../application/events';
import { IndexReader } from '../../application/index-reader';

export const registerEventRoutes = (
  fastify: FastifyInstance,
  eventService: EventService,
  rootDir: string
) => {
  const indexReader = new IndexReader(rootDir);
  fastify.get('/api/v1/events', async (req) => {
    const query = req.query as {
      stream?: string;
      type?: string;
      status?: string;
      q?: string;
      limit?: string;
      offset?: string;
      indexed?: string;
    };
    const limit = query.limit ? Number(query.limit) : undefined;
    const offset = query.offset ? Number(query.offset) : undefined;

    if (query.indexed === '1') {
      return indexReader.listEvents({
        stream: query.stream,
        type: query.type,
        status: query.status,
        q: query.q,
        limit: Math.max(1, Math.min(limit ?? 50, 500)),
        offset: Math.max(0, offset ?? 0)
      });
    }

    return eventService.listEvents({
      stream: query.stream,
      type: query.type,
      status: query.status,
      q: query.q,
      limit,
      offset
    });
  });

  fastify.post('/api/v1/events', async (req, res) => {
    const result = eventService.createEvent(req.body);
    if (!result.success) {
      return res.status(400).send({ error: result.error });
    }
    return { ok: true };
  });
};
