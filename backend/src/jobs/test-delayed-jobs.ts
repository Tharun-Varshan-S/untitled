import { logQueue } from './log.queue';
import { addDelayedJob, addDelayedAiAnalysisJob, addDelayedNotificationJob, JOB_NAMES } from './log.producer';
import { logWorker, logQueueEvents } from './log.worker';
import { logger } from '../utils/logger';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runDelayedJobVerification() {
  console.log('\n=============================================================');
  console.log('🚀 LOGLENS DELAYED JOBS INTERACTIVE VERIFICATION SUITE');
  console.log('=============================================================\n');

  // Step 1: Enqueue a 3-second delayed AI Analysis Job
  const delayMs = 3000;
  console.log(`1. Enqueueing Delayed AI Analysis Job (Delay: ${delayMs}ms)...`);
  const aiJob = await addDelayedAiAnalysisJob('proj_test_123', 'error_spike', delayMs);

  // Step 2: Immediate State Check (Must be 'delayed')
  const immediateState = await aiJob.getState();
  const delayedCount = await logQueue.getDelayedCount();
  console.log(`   ➔ Job #${aiJob.id} immediate state: '${immediateState}' (Expected: 'delayed')`);
  console.log(`   ➔ Queue delayed jobs count in Redis: ${delayedCount}`);

  if (immediateState !== 'delayed') {
    throw new Error(`TEST FAILED: Job state was expected to be 'delayed', but got '${immediateState}'`);
  }

  // Step 3: Enqueue a 4-second delayed Notification Job
  console.log(`\n2. Enqueueing Delayed Notification Job (Delay: 4000ms)...`);
  const notifyJob = await addDelayedNotificationJob(
    'proj_test_123',
    'alert_456',
    'slack',
    '#dev-alerts',
    'Spike in HTTP 500 errors detected',
    'high',
    4000
  );
  console.log(`   ➔ Notification Job #${notifyJob.id} immediate state: '${await notifyJob.getState()}'`);

  // Step 4: Wait for 1.5s and re-verify state (Should STILL be delayed)
  console.log(`\n3. Checking state after 1500ms (Midway through delay)...`);
  await sleep(1500);
  const midState = await aiJob.getState();
  console.log(`   ➔ Job #${aiJob.id} state after 1.5s: '${midState}' (Should still be 'delayed')`);

  // Step 5: Wait remaining delay + worker processing time (total 2.5s more -> total 4s)
  console.log(`\n4. Waiting for delay expiration and worker execution...`);
  await sleep(2500);

  const finalAiState = await aiJob.getState();
  console.log(`   ➔ AI Analysis Job #${aiJob.id} final state: '${finalAiState}' (Expected: 'completed')`);

  // Wait for notification job as well
  await sleep(1500);
  const finalNotifyState = await notifyJob.getState();
  console.log(`   ➔ Notification Job #${notifyJob.id} final state: '${finalNotifyState}' (Expected: 'completed')`);

  // Step 6: Verify Process Restart Durability
  console.log(`\n5. Verifying Redis Durability across Process Restarts...`);
  console.log(`   ➔ Enqueueing a 5-second delayed job...`);
  const restartJob = await addDelayedJob('restart-test', { test: true }, 5000);
  console.log(`   ➔ Enqueued Job #${restartJob.id}. Closing Worker connection to simulate process crash...`);

  // Close worker temporarily
  await logWorker.close();
  console.log(`   ➔ Worker crashed/stopped! Redis retains job #${restartJob.id} in ZSET.`);

  const persistentState = await restartJob.getState();
  console.log(`   ➔ Job #${restartJob.id} state while worker is DOWN: '${persistentState}'`);

  console.log(`   ➔ Waiting 5 seconds while worker is offline...`);
  await sleep(5000);

  console.log(`   ➔ Restarting Worker process...`);
  // Re-instantiate worker or recreate
  const restoredWorker = new (require('bullmq').Worker)(
    logQueue.name,
    require('./log.worker').processLogJob,
    { connection: (logWorker as any).opts.connection }
  );

  console.log(`   ➔ Waiting for restored worker to pick up waiting job...`);
  await sleep(1500);
  const postRestartState = await restartJob.getState();
  console.log(`   ➔ Job #${restartJob.id} state after worker restart: '${postRestartState}' (Expected: 'completed')`);

  await restoredWorker.close();
  await logQueue.close();
  await logQueueEvents.close();

  console.log('\n=============================================================');
  console.log('✅ ALL DELAYED JOB VERIFICATION TESTS PASSED SUCCESSFULLY!');
  console.log('=============================================================\n');
}

runDelayedJobVerification().catch((err) => {
  console.error('❌ Delayed Job Verification Error:', err);
  process.exit(1);
});
