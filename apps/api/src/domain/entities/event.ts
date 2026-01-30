import crypto from 'node:crypto';
import { z } from 'zod';
import { ArtifactSchema } from '../value-objects/artifact';
import type { Artifact } from '../value-objects/artifact';
import { StreamSchema } from '../value-objects/streams';

const SeveritySchema = z.enum(['info', 'warn', 'error']);

export type EventSeverity = z.infer<typeof SeveritySchema>;

export const EventSchema = z.object({
  id: z.string().uuid().default(() => crypto.randomUUID()),
  correlationId: z.string().uuid().default(() => crypto.randomUUID()),
  actor: z.string().default('clawd'),
  severity: SeveritySchema.default('info'),
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
