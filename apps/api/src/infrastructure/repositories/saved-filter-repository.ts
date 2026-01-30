import fs from 'node:fs';
import path from 'node:path';
import type { SavedFilterRepositoryPort, SavedFilter } from '../../application/saved-filters';

export class SavedFilterRepository implements SavedFilterRepositoryPort {
  constructor(private readonly filePath: string) {}

  readAll(): SavedFilter[] {
    if (!fs.existsSync(this.filePath)) return [];
    try {
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as SavedFilter[]) : [];
    } catch {
      return [];
    }
  }

  writeAll(items: SavedFilter[]) {
    const dir = path.dirname(this.filePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(items, null, 2) + '\n', 'utf-8');
  }
}
