import { z } from 'zod';
import { ArtifactSchema } from '../value-objects/artifact';
import type { Artifact } from '../value-objects/artifact';
import { StreamSchema } from '../value-objects/streams';

export const EventSchema = z.object({
  ts: z.string(),
  stream: StreamSchema,
  type: z.string(),
  summary: z.string(),
  status: z.string().optional(),
  details: z.record(z.unknown()).optional(),
  artifacts: z.array(ArtifactSchema).optional(),
  tags: z.array(z.string()).optional(),
  source: z.object({ session: z.string().optional(), messageId: z.string().optional() }).optional()
});

export type Event = z.infer<typeof EventSchema>;
