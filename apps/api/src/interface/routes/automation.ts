import type { FastifyInstance } from 'fastify';
import crypto from 'node:crypto';
import { DigestService } from '../../application/digest';
import { ReminderService } from '../../application/reminders';

export const registerAutomationRoutes = (
  fastify: FastifyInstance,
  digestService: DigestService,
  reminderService: ReminderService
) => {
  fastify.get('/api/v1/digest/daily', async () => ({ ok: true, digest: digestService.daily() }));

  // NOTE: delivery endpoint intentionally omitted (use cron/message tool externally)

  fastify.get('/api/v1/reminders', async () => ({ items: reminderService.list() }));

  fastify.post('/api/v1/reminders', async (req, res) => {
    const body = req.body as { id?: string; message?: string; when?: string; stream?: string };
    if (!body?.message || !body?.when || !body?.stream) {
      return res.status(400).send({ error: 'Missing reminder fields' });
    }
    const id = body.id ?? crypto.randomUUID();
    return reminderService.create({ id, message: body.message, when: body.when, stream: body.stream });
  });
};
