import type { FastifyInstance } from 'fastify';
import { SavedFilterService } from '../../application/saved-filters';

export const registerSavedFilterRoutes = (fastify: FastifyInstance, service: SavedFilterService) => {
  fastify.get('/api/v1/saved-filters', async () => service.list());

  fastify.post('/api/v1/saved-filters', async (req, res) => {
    const result = service.save(req.body);
    if (!result.success) return res.status(400).send({ error: result.error });
    return { ok: true };
  });

  fastify.delete('/api/v1/saved-filters/:name', async (req) => {
    const params = req.params as { name: string };
    return service.remove(params.name);
  });
};
