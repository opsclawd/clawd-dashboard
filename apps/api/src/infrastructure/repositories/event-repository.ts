import { Event } from '../../domain';
import { EventRepositoryPort } from '../../application/events';
import { appendJsonLine, readJsonLines } from '../file-system';

export class EventRepository implements EventRepositoryPort {
  constructor(private readonly filePath: string) {}

  readAll() {
    return readJsonLines<Event>(this.filePath);
  }

  append(event: Event) {
    appendJsonLine(this.filePath, JSON.stringify(event));
  }
}
