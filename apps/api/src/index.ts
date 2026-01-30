import Fastify from 'fastify';
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

const app = Fastify({ logger: true });

const DATA_PATH = path.resolve(process.cwd(), '../../data/events.jsonl');

const EventSchema = z.object({
  ts: z.string(),
  stream: z.enum(['cannabis-on', 'job-search', 'marketing']),
  type: z.string(),
  summary: z.string(),
  status: z.string().optional(),
  details: z.record(z.unknown()).optional(),
  artifacts: z.array(z.object({ kind: z.string(), value: z.string() })).optional(),
  tags: z.array(z.string()).optional(),
  source: z.object({ session: z.string().optional(), messageId: z.string().optional() }).optional()
});

function redact(value: unknown) {
  if (typeof value !== 'string') return value;
  let v = value;
  v = v.replace(/\b\d{6}\b/g, '[REDACTED_CODE]');
  v = v.replace(/\b\d{10}\b/g, '[REDACTED_PHONE]');
  v = v.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]');
  return v;
}

function redactObject(obj: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) out[k] = redactObject(v as Record<string, unknown>);
    else if (Array.isArray(v)) out[k] = v.map((x) => (typeof x === 'string' ? redact(x) : x));
    else out[k] = redact(v);
  }
  return out;
}

function readEvents() {
  if (!fs.existsSync(DATA_PATH)) return [] as any[];
  const lines = fs.readFileSync(DATA_PATH, 'utf-8').split('\n').filter(Boolean);
  const items = [] as any[];
  for (const line of lines) {
    try {
      items.push(JSON.parse(line));
    } catch {
      // skip malformed lines
    }
  }
  return items;
}

app.get('/health', async () => ({ ok: true }));

app.get('/api/v1/events', async (req) => {
  const q = req.query as { stream?: string; type?: string; status?: string };
  let items = readEvents();
  if (q.stream) items = items.filter((e) => e.stream === q.stream);
  if (q.type) items = items.filter((e) => e.type === q.type);
  if (q.status) items = items.filter((e) => e.status === q.status);
  return { items: items.slice(-200).reverse() };
});

app.post('/api/v1/events', async (req, res) => {
  const parsed = EventSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).send({ error: parsed.error.flatten() });
  const redacted = {
    ...parsed.data,
    summary: redact(parsed.data.summary),
    details: parsed.data.details ? redactObject(parsed.data.details) : undefined
  };
  fs.appendFileSync(DATA_PATH, JSON.stringify(redacted) + '\n', 'utf-8');
  return { ok: true };
});

const port = Number(process.env.PORT ?? 5174);
const host = process.env.HOST ?? '127.0.0.1';

app.listen({ port, host }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
