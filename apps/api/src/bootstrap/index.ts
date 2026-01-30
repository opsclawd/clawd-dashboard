import { buildApp } from './build-app';
import { GitRepository } from '../infrastructure/git';
import { GitService } from '../application/git';
import { registerGitRoutes } from '../interface/routes/git';

export const startApi = async () => {
  const fastify = await buildApp();

  const gitRepository = new GitRepository(process.cwd());
  const gitService = new GitService(gitRepository);
  registerGitRoutes(fastify, gitService);

  const port = Number(process.env.PORT ?? 5174);
  const host = process.env.HOST ?? '127.0.0.1';

  try {
    await fastify.listen({ port, host });
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
};
