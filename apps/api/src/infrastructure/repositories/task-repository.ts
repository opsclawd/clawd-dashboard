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
}
