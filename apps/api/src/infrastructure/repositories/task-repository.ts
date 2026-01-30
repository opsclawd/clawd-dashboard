import { Task } from '../../domain';
import { TaskRepositoryPort } from '../../application/tasks';
import { appendJsonLine, readJsonLines } from '../file-system';

export class TaskRepository implements TaskRepositoryPort {
  constructor(private readonly filePath: string) {}

  readAll() {
    return readJsonLines<Task>(this.filePath);
  }

  append(task: Task) {
    appendJsonLine(this.filePath, JSON.stringify(task));
  }
}
