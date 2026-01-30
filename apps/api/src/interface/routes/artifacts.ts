import type { FastifyInstance } from 'fastify';
import { ArtifactService } from '../../application/artifacts';
import { GitService } from '../../application/git';

export const registerArtifactRoutes = (
  fastify: FastifyInstance,
  artifactService: ArtifactService,
  gitService: GitService
) => {
  fastify.get('/api/v1/artifacts', async () => {
    const res = artifactService.listArtifacts();
    return {
      ...res,
      items: res.items.map((it) => ({ ...it, lastCommitSha: gitService.getLastCommitForPath(it.path) }))
    };
  });
};
