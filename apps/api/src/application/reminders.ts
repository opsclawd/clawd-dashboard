import path from 'node:path';
import { readJsonFile, writeJsonFile } from '../infrastructure/json-store';
import { EventService } from './events';
import { TaskService } from './tasks';

export type Reminder = {
  id: string;
  message: string;
  when: string; // ISO
  stream: string;
};

export class ReminderService {
  private filePath = path.resolve(process.cwd(), '../../', 'data', 'reminders.json');

  constructor(private readonly eventService: EventService, private readonly taskService: TaskService) {}

  list(): Reminder[] {
    return readJsonFile(this.filePath, [] as Reminder[]);
  }

  create(reminder: Reminder) {
    const items = this.list();
    items.unshift(reminder);
    writeJsonFile(this.filePath, items);

    // write audit event
    this.eventService.createEvent({
      ts: new Date().toISOString(),
      stream: reminder.stream,
      type: 'reminder',
      summary: `Reminder scheduled: ${reminder.message}`,
      details: { when: reminder.when }
    });

    return { ok: true };
  }
}
