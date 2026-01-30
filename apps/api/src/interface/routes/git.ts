import type { FastifyInstance } from 'fastify';
import { GitService } from '../../application/git';

type CommitsQuery = {
  limit?: string;
  offset?: string;
};

type DiffQuery = {
  path?: string;
};

export const registerGitRoutes = (fastify: FastifyInstance, gitService: GitService) => {
  fastify.get('/api/v1/git/commits', async (req, res) => {
    const query = req.query as CommitsQuery;
    const parsedLimit = query.limit ? Number(query.limit) : undefined;
    const parsedOffset = query.offset ? Number(query.offset) : undefined;

    try {
      return gitService.listCommits({
        limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
        offset: Number.isFinite(parsedOffset) ? parsedOffset : undefined
      });
    } catch (error) {
      req.log.error(error, 'Failed to list commits');
      return res.status(500).send({ error: 'Unable to list commits' });
    }
  });

  fastify.get('/api/v1/git/commit/:sha', async (req, res) => {
    const sha = (req.params as { sha: string }).sha;
    try {
      const commit = gitService.getCommit(sha);
      if (!commit) {
        return res.status(404).send({ error: 'Commit not found' });
      }
      return commit;
    } catch (error) {
      req.log.error(error, 'Failed to read commit');
      return res.status(500).send({ error: 'Unable to read commit' });
    }
  });

  fastify.get('/api/v1/git/diff/:sha', async (req, res) => {
    const sha = (req.params as { sha: string }).sha;
    const query = req.query as DiffQuery;

    try {
      const diff = gitService.getDiff(sha, query.path);
      if (diff === null) {
        return res.status(404).send({ error: 'Diff not found' });
      }
      return { diff };
    } catch (error) {
      req.log.error(error, 'Failed to render diff');
      return res.status(500).send({ error: 'Unable to render diff' });
    }
  });
};
