import { spawnSync } from 'node:child_process';

export type GitCommitSummary = {
  sha: string;
  author: string;
  date: string;
  message: string;
};

export type GitCommitDetail = GitCommitSummary & {
  files: string[];
};

export type GitListCommitsParams = {
  limit?: number;
  offset?: number;
};

export type GitListCommitsResult = {
  items: GitCommitSummary[];
  limit: number;
  offset: number;
};

class GitCommandError extends Error {
  constructor(public readonly exitCode: number | null, public readonly stderr: string, message?: string) {
    super(message ?? 'Git command failed');
    Object.setPrototypeOf(this, GitCommandError.prototype);
  }
}

const MAX_COMMITS = 100;
const MIN_COMMITS = 1;

export interface GitRepositoryPort {
  listCommits(params?: GitListCommitsParams): GitListCommitsResult;
  getCommit(sha: string): GitCommitDetail | null;
  getDiff(sha: string, relativePath?: string): string | null;
}

export class GitRepository implements GitRepositoryPort {
  constructor(private readonly repoPath: string) {}

  listCommits(params: GitListCommitsParams = {}) {
    const limit = Math.min(MAX_COMMITS, Math.max(MIN_COMMITS, params.limit ?? 20));
    const offset = Math.max(0, params.offset ?? 0);
    const format = '%H%x1f%an%x1f%ai%x1f%s%x1e';
    const raw = this.runGit([
      'log',
      '-n',
      String(limit),
      '--skip',
      String(offset),
      '--date=iso-strict',
      `--pretty=format:${format}`
    ]);
    const items = raw
      .split('\x1e')
      .filter(Boolean)
      .map((entry) => {
        const [sha, author, date, message] = entry.split('\x1f');
        return {
          sha,
          author,
          date,
          message: message?.trim() ?? ''
        };
      });
    return { limit, offset, items };
  }

  getCommit(sha: string) {
    try {
      const meta = this.runGit(['show', '--quiet', '--date=iso-strict', '--pretty=format:%H\x1f%an\x1f%ai\x1f%s', sha]);
      const [commitSha, author, date, message] = meta.split('\x1f');
      const files = this.runGit(['diff-tree', '--no-commit-id', '--name-only', '-r', sha])
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      return {
        sha: commitSha,
        author,
        date,
        message: message?.trim() ?? '',
        files
      };
    } catch (error) {
      if (error instanceof GitCommandError && error.exitCode === 128) {
        return null;
      }
      throw error;
    }
  }

  getDiff(sha: string, relativePath?: string) {
    try {
      const args = ['show', '--pretty=format:', sha];
      if (relativePath) {
        args.push('--', relativePath);
      }
      return this.runGit(args).trimEnd();
    } catch (error) {
      if (error instanceof GitCommandError && error.exitCode === 128) {
        return null;
      }
      throw error;
    }
  }

  private runGit(args: string[]) {
    const result = spawnSync('git', args, { encoding: 'utf-8', cwd: this.repoPath });
    if (result.error) {
      throw result.error;
    }
    if (result.status !== 0) {
      throw new GitCommandError(result.status, result.stderr ?? '', `git ${args.join(' ')} failed`);
    }
    return result.stdout ?? '';
  }
}
