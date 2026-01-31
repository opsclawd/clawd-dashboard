import type { FastifyInstance } from 'fastify';
import { StreamService } from '../../application/streams';

export const registerStreamRoutes = (fastify: FastifyInstance, service: StreamService) => {
  // Cannabis checklist
  fastify.get('/api/v1/streams/cannabis/checklist', async () => ({ items: service.listCannabisChecklist() }));
  fastify.post('/api/v1/streams/cannabis/checklist', async (req) => {
    const body = req.body as { items?: any[] };
    service.saveCannabisChecklist(body.items ?? []);
    return { ok: true };
  });
  fastify.get('/api/v1/streams/cannabis/checklist/export', async () => ({ items: service.listCannabisChecklist() }));

  // Job applications
  fastify.get('/api/v1/streams/job-search/applications', async () => ({ items: service.listJobApplications() }));
  fastify.post('/api/v1/streams/job-search/applications', async (req) => {
    const body = req.body as { items?: any[] };
    service.saveJobApplications(body.items ?? []);
    return { ok: true };
  });
  fastify.get('/api/v1/streams/job-search/applications/export', async () => ({ items: service.listJobApplications() }));

  // Marketing campaigns
  fastify.get('/api/v1/streams/marketing/campaigns', async () => ({ items: service.listMarketingCampaigns() }));
  fastify.post('/api/v1/streams/marketing/campaigns', async (req) => {
    const body = req.body as { items?: any[] };
    service.saveMarketingCampaigns(body.items ?? []);
    return { ok: true };
  });
  fastify.get('/api/v1/streams/marketing/campaigns/export', async () => ({ items: service.listMarketingCampaigns() }));
};
