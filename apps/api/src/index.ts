import Fastify from 'fastify';

const app = Fastify({ logger: true });

app.get('/health', async () => ({ ok: true }));

app.get('/api/v1/events', async () => {
  // TODO: wire repository (JSONL source-of-truth + SQLite index)
  return { items: [] };
});

const port = Number(process.env.PORT ?? 5174);
const host = process.env.HOST ?? '127.0.0.1';

app.listen({ port, host }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
