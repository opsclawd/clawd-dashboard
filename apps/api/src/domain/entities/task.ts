import { z } from 'zod';
import { StreamSchema } from '../value-objects/streams';

export const TaskSchema = z.object({
  id: z.string(),
  ts: z.string(),
  stream: StreamSchema,
  title: z.string(),
  status: z.enum(['backlog', 'next', 'in_progress', 'blocked', 'done'])
});

export type Task = z.infer<typeof TaskSchema>;
