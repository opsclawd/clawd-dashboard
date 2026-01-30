import { z } from 'zod';

export const StreamSchema = z.enum(['cannabis-on', 'job-search', 'marketing']);
export type Stream = z.infer<typeof StreamSchema>;
