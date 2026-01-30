import type { FastifyInstance } from 'fastify';
import { ArtifactService } from '../../application/artifacts';

export const registerArtifactRoutes = (fastify: FastifyInstance, artifactService: ArtifactService) => {
  fastify.get('/api/v1/artifacts', async () => artifactService.listArtifacts());
};
