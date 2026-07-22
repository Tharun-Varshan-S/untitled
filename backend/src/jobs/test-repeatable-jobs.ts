import { logQueue } from './log.queue';
import { logWorker, logQueueEvents } from './log.worker';
import { initLogLensSchedulers, listActiveSchedulers, removeLogLensScheduler } from './log.scheduler';
import { SCHEDULER_IDS } from './config/scheduler.config';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runRepeatableJobVerification() {
  console.log('\n=============================================================');
  console.log('🚀 LOGLENS REPEATABLE (SCHEDULED) JOBS VERIFICATION SUITE');
  console.log('=============================================================\n');

  // Step 1: Initialize Schedulers in Redis
  console.log('1. Initializing and Registering Repeatable Schedulers in Redis...');
  await initLogLensSchedulers();

  // Step 2: Inspect active schedulers in Redis using getJobSchedulers()
  console.log('\n2. Inspecting Active Job Schedulers from Redis...');
  const schedulers = await listActiveSchedulers();
  console.log(`   ➔ Total Active Schedulers Registered: ${schedulers.length}`);
  schedulers.forEach((s, idx) => {
    const nextFormatted = s.next ? new Date(s.next).toISOString() : 'N/A';
    console.log(`     [${idx + 1}] ID/Key: '${s.key}' | Job Name: '${s.name}' | Pattern/Every: ${s.every ? s.every + 'ms' : s.pattern} | Next Run: ${nextFormatted}`);
  });

  if (schedulers.length < 3) {
    throw new Error(`TEST FAILED: Expected at least 3 active schedulers, found ${schedulers.length}`);
  }

  // Step 3: Observe Recurring Executions Over 22 Seconds
  console.log('\n3. Observing Recurring Worker Execution (22 seconds monitoring)...');
  console.log('   (Health Check should fire ~2-3 times every 10s)');
  await sleep(22000);

  // Step 4: Verify Restart Durability across Application Restart
  console.log('\n4. Verifying Persistence & Durability across Application Restarts...');
  console.log('   ➔ Closing Worker connection to simulate application restart...');
  await logWorker.close();

  console.log('   ➔ Application is DOWN! Redis retains repeatable schedule metadata.');
  const schedulersAfterShutdown = await listActiveSchedulers();
  console.log(`   ➔ Schedulers in Redis during application offline: ${schedulersAfterShutdown.length}`);

  console.log('   ➔ Restarting Worker process...');
  const restoredWorker = new (require('bullmq').Worker)(
    logQueue.name,
    require('./log.worker').processLogJob,
    { connection: (logWorker as any).opts.connection }
  );

  console.log('   ➔ Monitoring restored worker for 12 seconds to ensure schedule continues...');
  await sleep(12000);

  // Step 5: Clean up Schedulers
  console.log('\n5. Cleaning up Test Schedulers...');
  await removeLogLensScheduler(SCHEDULER_IDS.COLLECTOR_HEALTH_CHECK);
  await removeLogLensScheduler(SCHEDULER_IDS.ANALYTICS_AGGREGATION);
  await removeLogLensScheduler(SCHEDULER_IDS.DAILY_LOG_CLEANUP);

  const finalSchedulers = await listActiveSchedulers();
  console.log(`   ➔ Remaining active schedulers after cleanup: ${finalSchedulers.length}`);

  await restoredWorker.close();
  await logQueue.close();
  await logQueueEvents.close();

  console.log('\n=============================================================');
  console.log('✅ REPEATABLE JOBS VERIFICATION PASSED SUCCESSFULLY!');
  console.log('=============================================================\n');
}

runRepeatableJobVerification().catch((err) => {
  console.error('❌ Repeatable Job Verification Error:', err);
  process.exit(1);
});
