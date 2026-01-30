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

    this.repository.append(redacted);
    return { success: true };
  }
}
