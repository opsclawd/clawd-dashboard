export type StreamId = 'cannabis-on' | 'job-search' | 'marketing';
export type EventType =
  | 'research'
  | 'plan'
  | 'file_write'
  | 'file_edit'
  | 'command'
  | 'browser'
  | 'message'
  | 'decision'
  | 'reminder'
  | 'task';

export type EventStatus = 'planned' | 'in_progress' | 'done' | 'blocked';

export type AuditEvent = {
  ts: string; // ISO
  stream: StreamId;
  type: EventType;
  status?: EventStatus;
  summary: string;
  details?: Record<string, unknown>;
  artifacts?: Array<{ kind: 'file' | 'url' | 'screenshot'; value: string }>;
  tags?: string[];
  source?: { session?: string; messageId?: string };
};
