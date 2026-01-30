import type {
  GitCommitDetail,
  GitListCommitsParams,
  GitListCommitsResult,
  GitRepositoryPort
} from '../infrastructure/git';

export type GitListOptions = GitListCommitsParams;

export class GitService {
  constructor(private readonly repository: GitRepositoryPort) {}

  listCommits(options?: GitListOptions): GitListCommitsResult {
    return this.repository.listCommits(options);
  }

  getCommit(sha: string): GitCommitDetail | null {
    return this.repository.getCommit(sha);
  }

  getDiff(sha: string, relativePath?: string): string | null {
    return this.repository.getDiff(sha, relativePath);
  }

  getLastCommitForPath(relativePath: string): string | null {
    return this.repository.getLastCommitForPath(relativePath);
  }
}
