import { EventRepository } from '../infrastructure/repositories/event-repository';
import { TaskRepository } from '../infrastructure/repositories/task-repository';

export class DigestService {
  constructor(private readonly eventRepo: EventRepository, private readonly taskRepo: TaskRepository) {}

  daily() {
    const since = Date.now() - 24 * 60 * 60 * 1000;
    const events = this.eventRepo.readAll().filter((e) => new Date(e.ts).getTime() >= since);
    const tasks = this.taskRepo.readAll();
    const done = tasks.filter((t) => t.status === 'done');

    const byStream: Record<string, number> = {};
    for (const ev of events) {
      byStream[ev.stream] = (byStream[ev.stream] ?? 0) + 1;
    }

    return {
      windowHours: 24,
      eventCount: events.length,
      eventsByStream: byStream,
      tasksDone: done.length
    };
  }
}
