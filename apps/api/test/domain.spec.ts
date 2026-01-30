import { describe, it, expect } from 'vitest';
import * as domain from '../src/domain';
import { EventSchema } from '../src/domain/entities/event';
import { TaskSchema } from '../src/domain/entities/task';

describe('domain index re-exports', () => {
  it('exposes event and task schemas', () => {
    expect(domain.EventSchema).toBe(EventSchema);
    expect(domain.TaskSchema).toBe(TaskSchema);
  });

  it('event schema defaults actor/severity', () => {
    const parsed = EventSchema.parse({
      ts: new Date().toISOString(),
      stream: 'dashboard',
      type: 'plan',
      summary: 'defaults test'
    });
    expect(parsed.actor).toBe('clawd');
    expect(parsed.severity).toBe('info');
  });
});
