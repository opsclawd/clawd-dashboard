import crypto from 'node:crypto';
import { EventSchema, redactObject, redactString } from '../domain';
import type { Event } from '../domain';

export type EventFilters = {
  stream?: string;
  type?: string;
  status?: string;
  q?: string;
  limit?: number;
  offset?: number;
};

export type EventRepositoryPort = {
  readAll: () => Event[];
  readLast?: () => Event | null;
  append: (event: Event) => void;
};

type EventSafeParseResult = ReturnType<typeof EventSchema.safeParse>;
type EventValidationError = Extract<EventSafeParseResult, { success: false }>['error'] extends { flatten: () => infer F }
  ? F
  : never;

export type CreateEventResult =
  | { success: true }
  | { success: false; error: EventValidationError };

export class EventService {
  private readonly repository: EventRepositoryPort;

  constructor(repository: EventRepositoryPort) {
    this.repository = repository;
  }

  listEvents(filters: EventFilters) {
    let items = this.repository.readAll();
    if (filters.stream) items = items.filter((event) => event.stream === filters.stream);
    if (filters.type) items = items.filter((event) => event.type === filters.type);
    if (filters.status) items = items.filter((event) => event.status === filters.status);
    if (filters.q) {
      const q = filters.q.toLowerCase();
      items = items.filter((event) => {
        const haystack = `${event.stream} ${event.type} ${event.summary}`.toLowerCase();
        return haystack.includes(q);
      });
    }

    const ordered = items.slice().reverse();
    const total = ordered.length;
    const limit = Math.max(1, Math.min(filters.limit ?? 50, 500));
    const offset = Math.max(0, filters.offset ?? 0);
    const paged = ordered.slice(offset, offset + limit);

    return { items: paged, total, limit, offset };
  }

  createEvent(payload: unknown): CreateEventResult {
    const parsed = EventSchema.safeParse(payload);
    if (!parsed.success) {
      return { success: false, error: parsed.error!.flatten() };
    }

    const redacted: Event = {
      ...parsed.data,
      summary: redactString(parsed.data.summary),
      details: parsed.data.details ? redactObject(parsed.data.details) : undefined
    };

    const prevHash = this.repository.readLast ? this.repository.readLast()?.hash : this.repository.readAll().at(-1)?.hash;
    const hash = computeEventHash({ ...redacted, prevHash });

    this.repository.append({ ...redacted, prevHash, hash });
    return { success: true };
  }
}

const computeEventHash = (event: Event) => {
  const canonicalPayload: Record<string, unknown> = { ...event };
  delete canonicalPayload.hash;
  const canonical = stableStringify(canonicalPayload);
  return sha256(`${event.prevHash ?? ''}${canonical}`);
};

const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

const stableStringify = (input: unknown): string => {
  if (input === null || typeof input !== 'object') return JSON.stringify(input);
  if (Array.isArray(input)) return `[${input.map((item) => stableStringify(item)).join(',')}]`;
  const entries = Object.entries(input as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `"${key}":${stableStringify(value)}`);
  return `{${entries.join(',')}}`;
};

