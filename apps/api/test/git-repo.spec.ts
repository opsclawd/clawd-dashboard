import { describe, it, expect } from 'vitest';
import { GitRepository } from '../src/infrastructure/git';
import path from 'node:path';

describe('GitRepository', () => {
  const repo = new GitRepository(path.resolve(process.cwd()));

  it('lists commits and exposes at least one SHA', () => {
    const result = repo.listCommits({ limit: 1 });
    expect(result.items.length).toBeGreaterThanOrEqual(1);
    expect(result.items[0].sha).toHaveLength(40);
  });

  it('diffs a known file and handles invalid SHAs gracefully', () => {
    const sha = repo.listCommits({ limit: 1 }).items[0].sha;
    const diff = repo.getDiff(sha, 'package.json');
    expect(typeof diff).toBe('string');
    const missing = repo.getDiff('deadbeefdeadbeefdeadbeefdeadbeefdeadbeef');
    expect(missing).toBeNull();
  });

  it('retrieves commit details and last commit for a path', () => {
    const sha = repo.listCommits({ limit: 1 }).items[0].sha;
    const detail = repo.getCommit(sha);
    expect(detail).not.toBeNull();
    expect(detail?.sha).toBe(sha);
    const last = repo.getLastCommitForPath('package.json');
    expect(last).toHaveLength(40);
    const missingPath = repo.getLastCommitForPath('no-such-file.xyz');
    expect(missingPath).toBeNull();
  });
});
