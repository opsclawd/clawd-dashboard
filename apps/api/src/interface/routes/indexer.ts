import type { FastifyInstance } from 'fastify';
import type { IndexService, IndexResult } from '../../application/indexer';

export const registerIndexerRoutes = (fastify: FastifyInstance, indexService: IndexService) => {
  fastify.post('/api/v1/index/rebuild', async () => {
    const result: IndexResult = indexService.rebuild();
    return { ok: true, result };
  });

  fastify.post('/api/v1/index/tick', async () => {
    const result: IndexResult = indexService.tick();
    return { ok: true, result };
  });
};
