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
    svc.saveCannabisChecklist([{ id: 'c1', title: 'Checklist', status: 'todo' }]);
    svc.saveJobApplications([{ id: 'a1', company: 'Co', role: 'Dev', status: 'applied' }]);
    svc.saveMarketingCampaigns([{ id: 'm1', name: 'Campaign', status: 'idea' }]);

    expect(svc.listCannabisChecklist().length).toBe(1);
    expect(svc.listJobApplications().length).toBe(1);
    expect(svc.listMarketingCampaigns().length).toBe(1);

    expect(svc.reportCannabisChecklistMarkdown()).toContain('Cannabis (ON) checklist report');
    expect(svc.reportJobApplicationsMarkdown()).toContain('Job search report');
    expect(svc.reportMarketingCampaignsMarkdown()).toContain('Marketing experiments report');

    process.chdir(cwd);
    fs.rmSync(root, { recursive: true, force: true });
  });
});
