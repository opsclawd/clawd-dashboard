import fs from 'node:fs';
import path from 'node:path';
import type { Task } from '../../domain';
import type { TaskRepositoryPort } from '../../application/tasks';
import { appendJsonLine, readJsonLines } from '../file-system';

export class TaskRepository implements TaskRepositoryPort {
  private readonly filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  readAll() {
    return readJsonLines<Task>(this.filePath);
  }

  append(task: Task) {
    appendJsonLine(this.filePath, JSON.stringify(task));
  }

  writeAll(tasks: Task[]) {
    const directory = path.dirname(this.filePath);
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(this.filePath, tasks.map((t) => JSON.stringify(t)).join('\n') + '\n', 'utf-8');
  }
}
