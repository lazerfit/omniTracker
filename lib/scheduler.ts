import cron from 'node-cron';

import { takeSnapshot } from '@/lib/snapshot';

export function startScheduler(): void {
  // Run every day at 00:00 UTC
  cron.schedule('0 0 * * *', async () => {
    console.log('[scheduler] Taking portfolio snapshot...');
    try {
      await takeSnapshot();
      console.log('[scheduler] Snapshot complete.');
    } catch (err) {
      console.error('[scheduler] Snapshot failed:', err);
    }
  });
  console.log('[scheduler] Started — daily snapshot at 00:00 UTC');
}
