import { describe, it, expect, beforeEach } from 'vitest';
import { SavedFilterService } from '../src/application/saved-filters';
import { SavedFilterRepository } from '../src/infrastructure/repositories/saved-filter-repository';
import path from 'node:path';
import fs from 'node:fs';

describe('SavedFilterService', () => {
  const tmp = path.join(process.cwd(), 'test-saved-filters.json');
  let repo: SavedFilterRepository;
  let service: SavedFilterService;

  beforeEach(() => {
    if (fs.existsSync(tmp)) fs.rmSync(tmp);
    repo = new SavedFilterRepository(tmp);
    service = new SavedFilterService(repo);
  });

  it('saves and removes filter by name', () => {
    const filter = { name: 'one', stream: '', type: '', status: '', limit: 25, query: '' };
    expect(service.save(filter)).toEqual({ success: true });
    expect(repo.readAll()).toHaveLength(1);
    service.remove('one');
    expect(repo.readAll()).toHaveLength(0);
  });

  it('returns validation error for bad payload', () => {
    const result = service.save({});
    expect(result.success).toBe(false);
    expect(result.error?.formErrors).toBeDefined();
  });
});
