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
  fastify.get('/api/v1/streams/cannabis/checklist/export', async (req, res) => {
    const items = service.listCannabisChecklist();
    res.header('content-type', 'text/csv');
    const csv = ['id,title,status,notes,taskId,archivedAt', ...items.map((i) => `${i.id},${i.title},${i.status},${i.notes ?? ''},${i.taskId ?? ''},${i.archivedAt ?? ''}`)].join('\n');
    return csv;
  });
  fastify.get('/api/v1/streams/cannabis/checklist/report.md', async (req, res) => {
    res.header('content-type', 'text/markdown');
    return service.reportCannabisChecklistMarkdown();
  });

  // Job applications
  fastify.get('/api/v1/streams/job-search/applications', async () => ({ items: service.listJobApplications() }));
  fastify.post('/api/v1/streams/job-search/applications', async (req) => {
    const body = req.body as { items?: any[] };
    service.saveJobApplications(body.items ?? []);
    return { ok: true };
  });
  fastify.get('/api/v1/streams/job-search/applications/export', async (req, res) => {
    const items = service.listJobApplications();
    res.header('content-type', 'text/csv');
    const csv = ['id,company,role,link,status,followUpDate,resume,taskId,archivedAt', ...items.map((i) => `${i.id},${i.company},${i.role},${i.link ?? ''},${i.status},${i.followUpDate ?? ''},${i.resume ?? ''},${i.taskId ?? ''},${i.archivedAt ?? ''}`)].join('\n');
    return csv;
  });
  fastify.get('/api/v1/streams/job-search/applications/report.md', async (req, res) => {
    res.header('content-type', 'text/markdown');
    return service.reportJobApplicationsMarkdown();
  });

  // Marketing campaigns
  fastify.get('/api/v1/streams/marketing/campaigns', async () => ({ items: service.listMarketingCampaigns() }));
  fastify.post('/api/v1/streams/marketing/campaigns', async (req) => {
    const body = req.body as { items?: any[] };
    service.saveMarketingCampaigns(body.items ?? []);
    return { ok: true };
  });
  fastify.get('/api/v1/streams/marketing/campaigns/export', async (req, res) => {
    const items = service.listMarketingCampaigns();
    res.header('content-type', 'text/csv');
    const csv = ['id,name,status,hypothesis,metric,result,date,taskId,nextStep,archivedAt', ...items.map((i) => `${i.id},${i.name},${i.status},${i.hypothesis ?? ''},${i.metric ?? ''},${i.result ?? ''},${i.date ?? ''},${i.taskId ?? ''},${i.nextStep ?? ''},${i.archivedAt ?? ''}`)].join('\n');
    return csv;
  });
  fastify.get('/api/v1/streams/marketing/campaigns/report.md', async (req, res) => {
    res.header('content-type', 'text/markdown');
    return service.reportMarketingCampaignsMarkdown();
  });
};
