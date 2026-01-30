import type { FastifyInstance } from 'fastify';
import { GitService } from '../../application/git';

export const registerGitRoutes = (fastify: FastifyInstance, gitService: GitService) => {
  fastify.get('/api/v1/git/commits', async (req) => {
    const query = req.query as { limit?: string; offset?: string };
    return gitService.listCommits({
      limit: query.limit ? Number(query.limit) : undefined,
      offset: query.offset ? Number(query.offset) : undefined
    });
  });

  fastify.get('/api/v1/git/commit/:sha', async (req) => {
    const params = req.params as { sha: string };
    return gitService.getCommit(params.sha);
  });

  fastify.get('/api/v1/git/diff/:sha', async (req) => {
    const params = req.params as { sha: string };
    const query = req.query as { path?: string };
    return gitService.getDiff(params.sha, query.path);
  });
};
