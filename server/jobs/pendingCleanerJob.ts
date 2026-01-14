import { startPeriodicCleanup, runCleanupOnce } from '../pendingCleaner.ts';

let worker: any = null;
let queue: any = null;

export async function startJobRunner(options: { intervalSeconds?: number; notifyFn?: (chatId: string, text: string) => Promise<void> | void } = {}) {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    // fallback to in-process interval
    console.warn('REDIS_URL not set; running pending cleaner with in-process interval');
    return startPeriodicCleanup(options.intervalSeconds || 60, options.notifyFn);
  }

  try {
    const { Queue, Worker } = await import('bullmq');
    queue = new Queue('pending-cleaner', { connection: { url: redisUrl } });
    worker = new Worker('pending-cleaner', async (job: any) => {
      const removed = await runCleanupOnce(options.notifyFn);
      return { removedCount: removed?.length ?? 0 };
    }, { connection: { url: redisUrl } });

    // schedule a repeating job every intervalSeconds
    await queue.add('schedule', {}, { repeat: { every: (options.intervalSeconds || 60) * 1000 } });

    worker.on('failed', (job: any, err: any) => console.error('pending-cleaner job failed', job.id, err));

    return async () => {
      await worker.close();
      await queue.close();
    };
  } catch (err) {
    console.warn('Failed to initialize BullMQ, falling back to in-process interval:', (err as any)?.message || err);
    return startPeriodicCleanup(options.intervalSeconds || 60, options.notifyFn);
  }
}

export default { startJobRunner };
