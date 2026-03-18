import cron from 'node-cron';

export function startScheduler(): void {
  // takeSnapshot is dynamically imported to prevent Turbopack from statically
  // bundling bun:sqlite at server startup via the instrumentation hook.
  cron.schedule('0 0 * * *', async () => {
    console.log('[scheduler] Taking portfolio snapshot...');
    try {
      const { takeSnapshot } = await import('@/lib/snapshot');
      await takeSnapshot();
      console.log('[scheduler] Snapshot complete.');
    } catch (err) {
      console.error('[scheduler] Snapshot failed:', err);
    }
  });
  console.log('[scheduler] Started — daily snapshot at 00:00 UTC');
}
