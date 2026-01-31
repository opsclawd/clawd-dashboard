import type { FastifyInstance } from 'fastify';
import { verifyLogIntegrity } from '../../application/integrity';

export const registerIntegrityRoutes = (fastify: FastifyInstance, rootDir: string) => {
  fastify.get('/api/v1/integrity/check', async () => verifyLogIntegrity(rootDir));
};
