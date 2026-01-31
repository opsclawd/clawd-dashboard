import { describe, it, expect } from 'vitest';
import { StreamService } from '../src/application/streams';
import fs from 'node:fs';
import path from 'node:path';

describe('StreamService', () => {
  it('saves and loads stream data', () => {
    const root = path.join(process.cwd(), 'test-streams');
    fs.mkdirSync(path.join(root, 'streams', 'cannabis-on'), { recursive: true });
    fs.mkdirSync(path.join(root, 'streams', 'job-search'), { recursive: true });
    fs.mkdirSync(path.join(root, 'streams', 'marketing'), { recursive: true });

    const cwd = process.cwd();
    process.chdir(root);
    const svc = new StreamService();
    svc.saveCannabisChecklist([
      { id: 'c1', title: 'Checklist todo', status: 'todo', notes: 'note', taskId: 't1' },
      { id: 'c2', title: 'Checklist in progress', status: 'in_progress' },
      { id: 'c3', title: 'Checklist done', status: 'done' },
      { id: 'c4', title: 'Checklist archived', status: 'done', archivedAt: '2026-01-01T00:00:00.000Z' }
    ]);
    svc.saveJobApplications([
      { id: 'a1', company: 'Co', role: 'Dev', status: 'applied', followUpDate: '2026-01-10', resume: 'v1', taskId: 't1' },
      { id: 'a2', company: 'Co2', role: 'Dev2', status: 'draft', link: 'https://example.com' },
      { id: 'a3', company: 'Co3', role: 'Dev3', status: 'rejected', archivedAt: '2026-01-02T00:00:00.000Z' }
    ]);
    svc.saveMarketingCampaigns([
      {
        id: 'm1',
        name: 'Campaign idea',
        status: 'idea',
        hypothesis: 'hypo',
        metric: 'metric',
        result: 'result',
        date: '2026-01-03',
        taskId: 't1',
        nextStep: 'ship'
      },
      { id: 'm2', name: 'Campaign published', status: 'published', metric: 'm', result: 'r' },
      { id: 'm3', name: 'Campaign archived', status: 'measured', archivedAt: '2026-01-04T00:00:00.000Z' }
    ]);

    expect(svc.listCannabisChecklist().length).toBe(4);
    expect(svc.listJobApplications().length).toBe(3);
    expect(svc.listMarketingCampaigns().length).toBe(3);

    const cannabisReport = svc.reportCannabisChecklistMarkdown();
    expect(cannabisReport).toContain('Cannabis (ON) checklist report');
    expect(cannabisReport).toContain('## todo');
    expect(cannabisReport).toContain('Checklist todo');
    expect(cannabisReport).toContain('task: t1');
    expect(cannabisReport).toContain('## archived');
    expect(cannabisReport).toContain('Checklist archived');

    const jobReport = svc.reportJobApplicationsMarkdown();
    expect(jobReport).toContain('Job search report');
    expect(jobReport).toContain('## applied');
    expect(jobReport).toContain('Co — Dev');
    expect(jobReport).toContain('follow-up: 2026-01-10');
    expect(jobReport).toContain('resume: v1');
    expect(jobReport).toContain('task: t1');
    expect(jobReport).toContain('## archived');
    expect(jobReport).toContain('Co3 — Dev3');

    const marketingReport = svc.reportMarketingCampaignsMarkdown();
    expect(marketingReport).toContain('Marketing experiments report');
    expect(marketingReport).toContain('## idea');
    expect(marketingReport).toContain('Campaign idea');
    expect(marketingReport).toContain('next: ship');
    expect(marketingReport).toContain('task: t1');
    expect(marketingReport).toContain('## archived');
    expect(marketingReport).toContain('Campaign archived');

    process.chdir(cwd);
    fs.rmSync(root, { recursive: true, force: true });
  });
});
