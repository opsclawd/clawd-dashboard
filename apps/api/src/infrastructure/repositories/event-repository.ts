import type { Event } from '../../domain';
import type { EventRepositoryPort } from '../../application/events';
import { appendJsonLine, readJsonLines } from '../file-system';

export class EventRepository implements EventRepositoryPort {
  private readonly filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  readAll() {
    return readJsonLines<Event>(this.filePath);
  }

  readLast() {
    const items = readJsonLines<Event>(this.filePath);
    return items.length ? items[items.length - 1] : null;
  }

  append(event: Event) {
    appendJsonLine(this.filePath, JSON.stringify(event));
  }
}
