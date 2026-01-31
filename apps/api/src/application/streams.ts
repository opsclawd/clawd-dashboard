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
}
