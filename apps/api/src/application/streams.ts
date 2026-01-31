import path from 'node:path';
import { readJsonFile, writeJsonFile } from '../infrastructure/json-store';

export type ChecklistItem = {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  notes?: string;
  taskId?: string;
  archivedAt?: string;
};

export type JobApplication = {
  id: string;
  company: string;
  role: string;
  link?: string;
  status: 'draft' | 'applied' | 'interview' | 'offer' | 'rejected';
  followUpDate?: string;
  resume?: string;
  taskId?: string;
  archivedAt?: string;
};

export type Campaign = {
  id: string;
  name: string;
  status: 'idea' | 'draft' | 'published' | 'measured';
  hypothesis?: string;
  metric?: string;
  result?: string;
  date?: string;
  taskId?: string;
  nextStep?: string;
  archivedAt?: string;
};

const formatSection = (title: string) => `## ${title}\n`;

export class StreamService {
  private base = path.resolve(process.cwd(), '../../');

  private cannabisPath() {
    return path.join(this.base, 'streams', 'cannabis-on', 'checklist.json');
  }

  private jobPath() {
    return path.join(this.base, 'streams', 'job-search', 'applications.json');
  }

  private marketingPath() {
    return path.join(this.base, 'streams', 'marketing', 'campaigns.json');
  }

  listCannabisChecklist(): ChecklistItem[] {
    return readJsonFile(this.cannabisPath(), [] as ChecklistItem[]);
  }

  saveCannabisChecklist(items: ChecklistItem[]) {
    writeJsonFile(this.cannabisPath(), items);
  }

  listJobApplications(): JobApplication[] {
    return readJsonFile(this.jobPath(), [] as JobApplication[]);
  }

  saveJobApplications(items: JobApplication[]) {
    writeJsonFile(this.jobPath(), items);
  }

  listMarketingCampaigns(): Campaign[] {
    return readJsonFile(this.marketingPath(), [] as Campaign[]);
  }

  saveMarketingCampaigns(items: Campaign[]) {
    writeJsonFile(this.marketingPath(), items);
  }

  reportCannabisChecklistMarkdown(): string {
    const allItems = this.listCannabisChecklist();
    const items = allItems.filter((item) => !item.archivedAt);
    const archived = allItems.filter((item) => item.archivedAt);

    const byStatus = items.reduce(
      (acc, item) => {
        acc[item.status].push(item);
        return acc;
      },
      { todo: [] as ChecklistItem[], in_progress: [] as ChecklistItem[], done: [] as ChecklistItem[] }
    );

    const lines: string[] = [];
    lines.push(`# Cannabis (ON) checklist report`);
    lines.push('');
    lines.push(
      `Active: ${items.length} (todo ${byStatus.todo.length}, in_progress ${byStatus.in_progress.length}, done ${byStatus.done.length}) • Archived: ${archived.length}`
    );
    lines.push('');

    (['todo', 'in_progress', 'done'] as const).forEach((status) => {
      const sectionItems = byStatus[status];
      lines.push(formatSection(status));
      if (sectionItems.length === 0) {
        lines.push('- (none)');
      } else {
        sectionItems.forEach((item) => {
          const meta: string[] = [];
          if (item.taskId) meta.push(`task: ${item.taskId}`);
          if (item.notes) meta.push(item.notes);
          const suffix = meta.length ? ` — ${meta.join(' | ')}` : '';
          lines.push(`- ${item.title}${suffix}`);
        });
      }
      lines.push('');
    });

    lines.push(formatSection('archived'));
    if (archived.length === 0) {
      lines.push('- (none)');
    } else {
      archived.forEach((item) => {
        const meta: string[] = [];
        if (item.taskId) meta.push(`task: ${item.taskId}`);
        if (item.notes) meta.push(item.notes);
        if (item.archivedAt) meta.push(`archived: ${item.archivedAt}`);
        const suffix = meta.length ? ` — ${meta.join(' | ')}` : '';
        lines.push(`- ${item.title}${suffix}`);
      });
    }
    lines.push('');

    return lines.join('\n').trim() + '\n';
  }

  reportJobApplicationsMarkdown(): string {
    const allItems = this.listJobApplications();
    const items = allItems.filter((app) => !app.archivedAt);
    const archived = allItems.filter((app) => app.archivedAt);

    const byStatus = items.reduce(
      (acc, item) => {
        acc[item.status].push(item);
        return acc;
      },
      {
        draft: [] as JobApplication[],
        applied: [] as JobApplication[],
        interview: [] as JobApplication[],
        offer: [] as JobApplication[],
        rejected: [] as JobApplication[]
      }
    );

    const lines: string[] = [];
    lines.push(`# Job search report`);
    lines.push('');
    lines.push(
      `Active: ${items.length} (draft ${byStatus.draft.length}, applied ${byStatus.applied.length}, interview ${byStatus.interview.length}, offer ${byStatus.offer.length}, rejected ${byStatus.rejected.length}) • Archived: ${archived.length}`
    );
    lines.push('');

    (['draft', 'applied', 'interview', 'offer', 'rejected'] as const).forEach((status) => {
      const sectionItems = byStatus[status];
      lines.push(formatSection(status));
      if (sectionItems.length === 0) {
        lines.push('- (none)');
      } else {
        sectionItems.forEach((app) => {
          const bits: string[] = [`${app.company} — ${app.role}`];
          if (app.followUpDate) bits.push(`follow-up: ${app.followUpDate}`);
          if (app.resume) bits.push(`resume: ${app.resume}`);
          if (app.taskId) bits.push(`task: ${app.taskId}`);
          const suffix = bits.length > 1 ? ` (${bits.slice(1).join(', ')})` : '';
          const link = app.link ? ` — ${app.link}` : '';
          lines.push(`- ${bits[0]}${suffix}${link}`);
        });
      }
      lines.push('');
    });

    lines.push(formatSection('archived'));
    if (archived.length === 0) {
      lines.push('- (none)');
    } else {
      archived.forEach((app) => {
        const bits: string[] = [`${app.company} — ${app.role}`];
        if (app.followUpDate) bits.push(`follow-up: ${app.followUpDate}`);
        if (app.resume) bits.push(`resume: ${app.resume}`);
        if (app.taskId) bits.push(`task: ${app.taskId}`);
        if (app.archivedAt) bits.push(`archived: ${app.archivedAt}`);
        const suffix = bits.length > 1 ? ` (${bits.slice(1).join(', ')})` : '';
        const link = app.link ? ` — ${app.link}` : '';
        lines.push(`- ${bits[0]}${suffix}${link}`);
      });
    }
    lines.push('');

    return lines.join('\n').trim() + '\n';
  }

  reportMarketingCampaignsMarkdown(): string {
    const allItems = this.listMarketingCampaigns();
    const items = allItems.filter((campaign) => !campaign.archivedAt);
    const archived = allItems.filter((campaign) => campaign.archivedAt);

    const byStatus = items.reduce(
      (acc, item) => {
        acc[item.status].push(item);
        return acc;
      },
      {
        idea: [] as Campaign[],
        draft: [] as Campaign[],
        published: [] as Campaign[],
        measured: [] as Campaign[]
      }
    );

    const lines: string[] = [];
    lines.push(`# Marketing experiments report`);
    lines.push('');
    lines.push(
      `Active: ${items.length} (idea ${byStatus.idea.length}, draft ${byStatus.draft.length}, published ${byStatus.published.length}, measured ${byStatus.measured.length}) • Archived: ${archived.length}`
    );
    lines.push('');

    (['idea', 'draft', 'published', 'measured'] as const).forEach((status) => {
      const sectionItems = byStatus[status];
      lines.push(formatSection(status));
      if (sectionItems.length === 0) {
        lines.push('- (none)');
      } else {
        sectionItems.forEach((campaign) => {
          const details: string[] = [];
          if (campaign.date) details.push(campaign.date);
          if (campaign.metric) details.push(`metric: ${campaign.metric}`);
          if (campaign.result) details.push(`result: ${campaign.result}`);
          if (campaign.taskId) details.push(`task: ${campaign.taskId}`);
          if (campaign.nextStep) details.push(`next: ${campaign.nextStep}`);
          const suffix = details.length ? ` (${details.join(', ')})` : '';
          const hypo = campaign.hypothesis ? ` — ${campaign.hypothesis}` : '';
          lines.push(`- ${campaign.name}${suffix}${hypo}`);
        });
      }
      lines.push('');
    });

    lines.push(formatSection('archived'));
    if (archived.length === 0) {
      lines.push('- (none)');
    } else {
      archived.forEach((campaign) => {
        const details: string[] = [];
        if (campaign.date) details.push(campaign.date);
        if (campaign.metric) details.push(`metric: ${campaign.metric}`);
        if (campaign.result) details.push(`result: ${campaign.result}`);
        if (campaign.taskId) details.push(`task: ${campaign.taskId}`);
        if (campaign.nextStep) details.push(`next: ${campaign.nextStep}`);
        if (campaign.archivedAt) details.push(`archived: ${campaign.archivedAt}`);
        const suffix = details.length ? ` (${details.join(', ')})` : '';
        const hypo = campaign.hypothesis ? ` — ${campaign.hypothesis}` : '';
        lines.push(`- ${campaign.name}${suffix}${hypo}`);
      });
    }
    lines.push('');

    return lines.join('\n').trim() + '\n';
  }
}
