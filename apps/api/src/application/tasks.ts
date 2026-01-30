import { Task, TaskSchema } from '../domain';

export type TaskFilters = {
  stream?: string;
  status?: string;
};

export type TaskRepositoryPort = {
  readAll: () => Task[];
  append: (task: Task) => void;
};

type TaskSafeParseResult = ReturnType<typeof TaskSchema.safeParse>;
type TaskValidationError = Extract<TaskSafeParseResult, { success: false }>['error'] extends { flatten: () => infer F }
  ? F
  : never;

export type CreateTaskResult =
  | { success: true }
  | { success: false; error: TaskValidationError };

export class TaskService {
  constructor(private readonly repository: TaskRepositoryPort) {}

  listTasks(filters: TaskFilters) {
    let items = this.repository.readAll();
    if (filters.stream) items = items.filter((task) => task.stream === filters.stream);
    if (filters.status) items = items.filter((task) => task.status === filters.status);
    return { items: items.slice(-500).reverse() };
  }

  createTask(payload: unknown): CreateTaskResult {
    const parsed = TaskSchema.safeParse(payload);
    if (!parsed.success) {
      return { success: false, error: parsed.error!.flatten() };
    }

    this.repository.append(parsed.data);
    return { success: true };
  }
}
