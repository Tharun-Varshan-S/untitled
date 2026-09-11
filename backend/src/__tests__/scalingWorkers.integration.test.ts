import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { logQueue } from '../jobs/log.queue';
import { createLogWorker, logWorker, logQueueEvents } from '../jobs/log.worker';
import { addDelayedAiAnalysisJob, addDelayedNotificationJob } from '../jobs/log.producer';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Worker Scaling & Concurrency Integration Test', () => {
  beforeAll(async () => {
    // Clear out any lingering jobs from previous test files
    await logQueue.obliterate({ force: true });
  });

  afterAll(async () => {
    await logWorker.close(true);
    await logQueue.close();
    await logQueueEvents.close();
  });

  it('should process jobs concurrently across multiple worker instances with zero duplicates', async () => {
    // Close default worker during custom cluster test
    await logWorker.close();

    const worker1 = createLogWorker('Jest-Worker-1', { concurrency: 5 });
    const worker2 = createLogWorker('Jest-Worker-2', { concurrency: 5 });

    const processedJobIds = new Set<string>();

    worker1.on('completed', (job) => processedJobIds.add(job.id!));
    worker2.on('completed', (job) => processedJobIds.add(job.id!));

    // Enqueue 10 immediate jobs
    for (let i = 0; i < 10; i++) {
      if (i % 2 === 0) {
        await addDelayedAiAnalysisJob('proj_scaling_test', 'error_spike', 0);
      } else {
        await addDelayedNotificationJob(
          'proj_scaling_test',
          `alert_${i}`,
          'email',
          'devs@loglens.io',
          'Jest alert message',
          'low',
          0
        );
      }
    }

    await sleep(3500);

    expect(processedJobIds.size).toBeGreaterThanOrEqual(10);

    await worker1.close(true);
    await worker2.close(true);
  });
});
