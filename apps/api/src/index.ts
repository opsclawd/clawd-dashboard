import { startApi } from './bootstrap/index.ts';

startApi().catch((error) => {
  console.error('❌ Failed to start API', error);
  process.exit(1);
});
