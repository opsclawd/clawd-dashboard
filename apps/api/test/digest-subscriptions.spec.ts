import { describe, it, expect } from 'vitest';
import { DigestSubscriptionService } from '../src/application/digest-subscriptions';
import fs from 'node:fs';
import path from 'node:path';

describe('DigestSubscriptionService', () => {
  it('saves and removes subscriptions', () => {
    const root = path.join(process.cwd(), 'test-digest-subs');
    fs.mkdirSync(path.join(root, 'data'), { recursive: true });
    const cwd = process.cwd();
    process.chdir(root);
    const svc = new DigestSubscriptionService();
    svc.save({ id: 's1', channel: 'telegram', to: 'chat', enabled: true });
    expect(svc.list().length).toBe(1);
    svc.remove('s1');
    expect(svc.list().length).toBe(0);
    process.chdir(cwd);
    fs.rmSync(root, { recursive: true, force: true });
  });
});
