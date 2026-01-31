#!/usr/bin/env tsx
import { IndexService } from '../apps/api/src/application/indexer';

const command = process.argv[2] ?? 'tick';
const rootDir = process.cwd();
const service = new IndexService(rootDir);

if (command === 'rebuild') {
  const result = service.rebuild();
  console.log('rebuild complete', result);
} else if (command === 'tick') {
  const result = service.tick();
  console.log('tick complete', result);
} else {
  console.error('Unknown command', command);
  process.exit(1);
}
