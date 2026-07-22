import { logQueue } from '../jobs/log.queue';
import { initLogLensSchedulers, listActiveSchedulers, removeLogLensScheduler } from '../jobs/log.scheduler';
import { SCHEDULER_IDS } from '../jobs/config/scheduler.config';
import { logWorker } from '../jobs/log.worker';

describe('Repeatable (Scheduled) Jobs Integration Test', () => {
  afterAll(async () => {
    await removeLogLensScheduler(SCHEDULER_IDS.COLLECTOR_HEALTH_CHECK);
    await removeLogLensScheduler(SCHEDULER_IDS.ANALYTICS_AGGREGATION);
    await removeLogLensScheduler(SCHEDULER_IDS.DAILY_LOG_CLEANUP);
    await logWorker.close();
    await logQueue.close();
  });

  it('should register repeatable job schedulers idempotently in Redis', async () => {
    await initLogLensSchedulers();

    const schedulers = await listActiveSchedulers();
    expect(schedulers.length).toBeGreaterThanOrEqual(3);

    const healthCheckSched = schedulers.find((s) => s.key === SCHEDULER_IDS.COLLECTOR_HEALTH_CHECK);
    expect(healthCheckSched).toBeDefined();
    expect(healthCheckSched?.every).toBe(10000);
  });

  it('should allow clean removal of scheduled jobs', async () => {
    await removeLogLensScheduler(SCHEDULER_IDS.COLLECTOR_HEALTH_CHECK);

    const schedulers = await listActiveSchedulers();
    const found = schedulers.find((s) => s.key === SCHEDULER_IDS.COLLECTOR_HEALTH_CHECK);
    expect(found).toBeUndefined();
  });
});
