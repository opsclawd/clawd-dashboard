import { EventSchema, redactObject, redactString } from '../domain';
import type { Event } from '../domain';

export type EventFilters = {
  stream?: string;
  type?: string;
  status?: string;
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
    return { items: items.slice(-200).reverse() };
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
