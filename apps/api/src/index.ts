import Fastify from 'fastify';
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

const app = Fastify({ logger: true });

const ROOT = path.resolve(process.cwd(), '../../');
const EVENTS_PATH = path.join(ROOT, 'data/events.jsonl');
const TASKS_PATH = path.join(ROOT, 'data/tasks.jsonl');
const STREAMS_PATH = path.join(ROOT, 'streams');

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

const TaskSchema = z.object({
  id: z.string(),
  ts: z.string(),
  stream: z.enum(['cannabis-on', 'job-search', 'marketing']),
  title: z.string(),
  status: z.enum(['backlog', 'next', 'in_progress', 'blocked', 'done'])
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

function readLines(filePath: string) {
  if (!fs.existsSync(filePath)) return [] as any[];
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n').filter(Boolean);
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

function walk(dir: string, base = dir): Array<{ path: string; mtimeMs: number }> {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const out: Array<{ path: string; mtimeMs: number }> = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...walk(full, base));
    } else {
      const stat = fs.statSync(full);
      out.push({ path: path.relative(base, full), mtimeMs: stat.mtimeMs });
    }
  }
  return out;
}

app.get('/health', async () => ({ ok: true }));

app.get('/api/v1/events', async (req) => {
  const q = req.query as { stream?: string; type?: string; status?: string };
  let items = readLines(EVENTS_PATH);
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
  fs.appendFileSync(EVENTS_PATH, JSON.stringify(redacted) + '\n', 'utf-8');
  return { ok: true };
});

app.get('/api/v1/tasks', async (req) => {
  const q = req.query as { stream?: string; status?: string };
  let items = readLines(TASKS_PATH);
  if (q.stream) items = items.filter((t) => t.stream === q.stream);
  if (q.status) items = items.filter((t) => t.status === q.status);
  return { items: items.slice(-500).reverse() };
});

app.post('/api/v1/tasks', async (req, res) => {
  const parsed = TaskSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).send({ error: parsed.error.flatten() });
  fs.appendFileSync(TASKS_PATH, JSON.stringify(parsed.data) + '\n', 'utf-8');
  return { ok: true };
});

app.get('/api/v1/artifacts', async () => {
  const streams = walk(STREAMS_PATH, ROOT).map((x) => ({ ...x, kind: 'stream' }));
  const extras = ['job-search.md', 'job-search.md', 'README.md']
    .map((p) => path.join(ROOT, p))
    .filter((p) => fs.existsSync(p))
    .map((p) => ({
      path: path.relative(ROOT, p),
      mtimeMs: fs.statSync(p).mtimeMs,
      kind: 'file'
    }));
  const items = [...streams, ...extras]
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
    .slice(0, 200);
  return { items };
});

const port = Number(process.env.PORT ?? 5174);
const host = process.env.HOST ?? '127.0.0.1';

app.listen({ port, host }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
