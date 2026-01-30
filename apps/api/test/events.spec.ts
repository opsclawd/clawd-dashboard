import { describe, it, expect } from 'vitest';
import { EventService } from '../src/application/events';
import { EventRepository } from '../src/infrastructure/repositories/event-repository';
import { EventSchema } from '../src/domain/entities/event';
import path from 'node:path';
import fs from 'node:fs';

describe('EventService', () => {
  const tmp = path.join(process.cwd(), 'test-events.jsonl');
  const repo = new EventRepository(tmp);
  const service = new EventService(repo);

  it('creates and lists events with q filter', () => {
    try {
      fs.writeFileSync(tmp, '', 'utf-8');
      const payload = {
        ts: new Date().toISOString(),
        stream: 'dashboard',
        type: 'plan',
        summary: 'Deploy Phase 2',
        id: '11111111-1111-1111-1111-111111111111',
        correlationId: '22222222-2222-2222-2222-222222222222',
        actor: 'clawd',
        severity: 'info'
      };
      expect(service.createEvent(payload)).toEqual({ success: true });
      const { items } = service.listEvents({ q: 'Deploy' });
      expect(items[0].summary).toBe('Deploy Phase 2');
    } finally {
      fs.rmSync(tmp, { force: true });
    }
  });

  it('returns validation error for invalid payload', () => {
    const result = service.createEvent({});
    expect(result.success).toBe(false);
    expect(result.error?.formErrors).toBeDefined();
  });

  it('filters by stream/status', () => {
    const payload = {
      ts: new Date().toISOString(),
      stream: 'dashboard',
      type: 'plan',
      summary: 'Filter test',
      id: '55555555-5555-5555-5555-555555555555',
      correlationId: '66666666-6666-6666-6666-666666666666',
      actor: 'clawd',
      severity: 'info',
      status: 'done'
    };
    fs.writeFileSync(tmp, '', 'utf-8');
    service.createEvent(payload);
    const { items } = service.listEvents({ stream: 'dashboard', status: 'done' });
    expect(items.length).toBeGreaterThanOrEqual(1);
  });
});
