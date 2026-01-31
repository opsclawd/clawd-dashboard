import path from 'node:path';
import { readJsonFile, writeJsonFile } from '../infrastructure/json-store';

export type ChecklistItem = {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  notes?: string;
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
};

export type Campaign = {
  id: string;
  name: string;
  status: 'idea' | 'draft' | 'published' | 'measured';
  hypothesis?: string;
  metric?: string;
  result?: string;
  date?: string;
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
    const items = this.listCannabisChecklist();
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
    lines.push(`Total: ${items.length} (todo ${byStatus.todo.length}, in_progress ${byStatus.in_progress.length}, done ${byStatus.done.length})`);
    lines.push('');

    (['todo', 'in_progress', 'done'] as const).forEach((status) => {
      const sectionItems = byStatus[status];
      lines.push(formatSection(status));
      if (sectionItems.length === 0) {
        lines.push('- (none)');
      } else {
        sectionItems.forEach((item) => {
          const noteSuffix = item.notes ? ` — ${item.notes}` : '';
          lines.push(`- ${item.title}${noteSuffix}`);
        });
      }
      lines.push('');
    });

    return lines.join('\n').trim() + '\n';
  }

  reportJobApplicationsMarkdown(): string {
    const items = this.listJobApplications();
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
      `Total: ${items.length} (draft ${byStatus.draft.length}, applied ${byStatus.applied.length}, interview ${byStatus.interview.length}, offer ${byStatus.offer.length}, rejected ${byStatus.rejected.length})`
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

    return lines.join('\n').trim() + '\n';
  }

  reportMarketingCampaignsMarkdown(): string {
    const items = this.listMarketingCampaigns();
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
      `Total: ${items.length} (idea ${byStatus.idea.length}, draft ${byStatus.draft.length}, published ${byStatus.published.length}, measured ${byStatus.measured.length})`
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
          const suffix = details.length ? ` (${details.join(', ')})` : '';
          const hypo = campaign.hypothesis ? ` — ${campaign.hypothesis}` : '';
          lines.push(`- ${campaign.name}${suffix}${hypo}`);
        });
      }
      lines.push('');
    });

    return lines.join('\n').trim() + '\n';
  }
}
