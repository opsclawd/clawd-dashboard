import type { FastifyInstance } from 'fastify';
import crypto from 'node:crypto';
import { DigestSubscriptionService } from '../../application/digest-subscriptions';

export const registerDigestSubscriptionRoutes = (
  fastify: FastifyInstance,
  service: DigestSubscriptionService
) => {
  fastify.get('/api/v1/digest/subscriptions', async () => ({ items: service.list() }));

  fastify.post('/api/v1/digest/subscriptions', async (req, res) => {
    const body = req.body as { id?: string; channel?: string; to?: string; enabled?: boolean };
    if (!body?.channel || !body?.to) return res.status(400).send({ error: 'Missing channel/to' });
    const id = body.id ?? crypto.randomUUID();
    return service.save({ id, channel: body.channel, to: body.to, enabled: body.enabled ?? true });
  });

  fastify.delete('/api/v1/digest/subscriptions/:id', async (req) => {
    const params = req.params as { id: string };
    return service.remove(params.id);
  });
};
