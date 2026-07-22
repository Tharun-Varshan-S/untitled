import { logQueue } from './log.queue';
import { addLogJob, addDelayedJob } from './log.producer';
import { getQueueMetrics, getFailedJobsSummary, cleanQueueHistory } from './log.monitoring';
import { logWorker, logQueueEvents } from './log.worker';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runQueueMonitoringVerification() {
  console.log('\n=============================================================');
  console.log('🚀 LOGLENS QUEUE MONITORING & INSPECTION VERIFICATION SUITE');
  console.log('=============================================================\n');

  // Step 1: Enqueue Successful Jobs (Immediate Execution -> Completed)
  console.log('1. Enqueueing 3 valid log processing jobs (will complete)...');
  await addLogJob({
    projectId: '60c72b2f9b1d8b2a3c4d5e6f',
    level: 'info',
    message: 'User logged in successfully',
    service: 'auth-service',
  });
  await addLogJob({
    projectId: '60c72b2f9b1d8b2a3c4d5e6f',
    level: 'warn',
    message: 'High memory utilization detected',
    service: 'metrics-service',
  });
  await addLogJob({
    projectId: '60c72b2f9b1d8b2a3c4d5e6f',
    level: 'info',
    message: 'Cache hit ratio optimal',
    service: 'cache-service',
  });

  // Step 2: Enqueue Delayed Jobs (Delayed State)
  console.log('\n2. Enqueueing 2 delayed jobs (Delayed state holding)...');
  await addDelayedJob('test-delayed-mon-1', { projectId: '60c72b2f9b1d8b2a3c4d5e6f', version: 1 }, 10000);
  await addDelayedJob('test-delayed-mon-2', { projectId: '60c72b2f9b1d8b2a3c4d5e6f', version: 1 }, 15000);

  // Step 3: Enqueue Failing Jobs (Invalid Schema -> Failed State)
  console.log('\n3. Enqueueing 2 invalid jobs (Will trigger UnrecoverableError -> Failed state)...');
  // Missing version & required fields causes payload validation failure
  await logQueue.add('process-single-log', { invalidData: true });
  await logQueue.add('process-single-log', { invalidData: true });

  // Wait 2.5 seconds for worker processing
  console.log('\n4. Waiting for Worker to process immediate & failing jobs...');
  await sleep(2500);

  // Step 4: Poll Queue Metrics Inspection API
  console.log('\n5. Invoking `getQueueMetrics()` Inspection API...');
  const metrics = await getQueueMetrics();
  console.log('   ➔ Metrics Summary:', JSON.stringify(metrics, null, 2));

  if (metrics.counts.completed === 0) {
    throw new Error('TEST FAILED: Expected completed jobs count > 0');
  }
  if (metrics.counts.failed === 0) {
    throw new Error('TEST FAILED: Expected failed jobs count > 0');
  }
  if (metrics.counts.delayed === 0) {
    throw new Error('TEST FAILED: Expected delayed jobs count > 0');
  }

  // Step 5: Poll Failed Jobs Summary API
  console.log('\n6. Invoking `getFailedJobsSummary()` API for root cause analysis...');
  const failedSummary = await getFailedJobsSummary(5);
  console.log(`   ➔ Retrieved ${failedSummary.length} failed job entries:`);
  failedSummary.forEach((job, idx) => {
    console.log(`     [${idx + 1}] ID: #${job.id} | Reason: "${job.failedReason}" | Attempts: ${job.attemptsMade}`);
  });

  // Step 6: Test Queue History Cleanup
  console.log('\n7. Testing Queue History Cleanup API (`cleanQueueHistory(0)`)...');
  const cleanResult = await cleanQueueHistory(0);
  console.log(`   ➔ Clean Result: Removed ${cleanResult.cleanedCompletedCount} completed jobs & ${cleanResult.cleanedFailedCount} failed jobs.`);

  const postCleanMetrics = await getQueueMetrics();
  console.log(`   ➔ Metrics after cleanup: Completed = ${postCleanMetrics.counts.completed}, Failed = ${postCleanMetrics.counts.failed}`);

  await logWorker.close();
  await logQueue.close();
  await logQueueEvents.close();

  console.log('\n=============================================================');
  console.log('✅ QUEUE MONITORING VERIFICATION SUITE PASSED SUCCESSFULLY!');
  console.log('=============================================================\n');
}

runQueueMonitoringVerification().catch((err) => {
  console.error('❌ Queue Monitoring Verification Error:', err);
  process.exit(1);
});
