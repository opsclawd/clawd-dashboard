import path from 'node:path';
import { readJsonFile, writeJsonFile } from '../infrastructure/json-store';

export type DigestSubscription = {
  id: string;
  channel: string; // e.g. email|telegram
  to: string;
  enabled: boolean;
};

export class DigestSubscriptionService {
  private filePath = path.resolve(process.cwd(), '../../', 'data', 'digest-subs.json');

  list(): DigestSubscription[] {
    return readJsonFile(this.filePath, [] as DigestSubscription[]);
  }

  save(sub: DigestSubscription) {
    const items = this.list();
    const next = items.filter((s) => s.id !== sub.id);
    next.unshift(sub);
    writeJsonFile(this.filePath, next);
    return { ok: true };
  }

  remove(id: string) {
    const items = this.list().filter((s) => s.id !== id);
    writeJsonFile(this.filePath, items);
    return { ok: true };
  }
}
