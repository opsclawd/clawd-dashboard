import { startApi } from './bootstrap';

startApi().catch((error) => {
  console.error('❌ Failed to start API', error);
  process.exit(1);
});
