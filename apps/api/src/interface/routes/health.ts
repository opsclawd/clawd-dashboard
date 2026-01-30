import type { FastifyInstance } from 'fastify';

export const registerHealthRoute = (fastify: FastifyInstance) => {
  fastify.get('/health', async () => ({ ok: true }));
};
