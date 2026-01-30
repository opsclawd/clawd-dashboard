import { describe, it, expect } from 'vitest';
import { GitService } from '../src/application/git';
import { GitRepositoryPort } from '../src/infrastructure/git';

describe('GitService', () => {
  class DummyRepo implements GitRepositoryPort {
    listCommits() {
      return { items: [], limit: 0, offset: 0 };
    }
    getCommit() {
      return null;
    }
    getDiff() {
      return 'diff';
    }
    getLastCommitForPath() {
      return 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
    }
  }

  it('delegates to repo', () => {
    const service = new GitService(new DummyRepo());
    expect(service.getDiff('sha')).toBe('diff');
    expect(service.getLastCommitForPath('README.md')).toHaveLength(40);
  });
});
