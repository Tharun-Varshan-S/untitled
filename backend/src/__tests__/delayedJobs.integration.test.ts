import { logQueue } from '../jobs/log.queue';
import { addDelayedAiAnalysisJob, addDelayedNotificationJob } from '../jobs/log.producer';
import { logWorker } from '../jobs/log.worker';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Delayed Jobs Integration Test', () => {
  afterAll(async () => {
    await logWorker.close();
    await logQueue.close();
  });

  it('should enqueue a job with delay and hold it in delayed state before processing', async () => {
    const delayMs = 1500;
    const job = await addDelayedAiAnalysisJob('proj_jest_test', 'scheduled_summary', delayMs);

    // Immediate state check
    const initialState = await job.getState();
    expect(initialState).toBe('delayed');

    // Wait until delay expires + worker completes
    await sleep(2200);

    const finalState = await job.getState();
    expect(finalState).toBe('completed');
  });

  it('should process delayed notification job after delay duration', async () => {
    const delayMs = 1000;
    const job = await addDelayedNotificationJob(
      'proj_jest_test',
      'alert_999',
      'email',
      'devops@loglens.io',
      'Critical latency alert',
      'critical',
      delayMs
    );

    expect(await job.getState()).toBe('delayed');

    await sleep(1800);

    expect(await job.getState()).toBe('completed');
  });
});
