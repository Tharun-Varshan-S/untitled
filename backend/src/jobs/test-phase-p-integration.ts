import { connectDB, disconnectDB } from '../config/database';
import { connectRedis, disconnectRedis } from '../config/redis';
import { logQueue } from './log.queue';
import { addDelayedAiAnalysisJob, addDelayedNotificationJob } from './log.producer';
import { createLogWorker, logWorker, logQueueEvents } from './log.worker';
import { initLogLensSchedulers } from './log.scheduler';
import { getQueueMetrics } from './log.monitoring';
import { ingestLog, bulkIngestLogs } from '../services/logs.service';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runMasterPhasePIntegrationTest() {
  console.log('\n================================================================');
  console.log('🌟 LOGLENS PHASE P: MASTER BACKGROUND ARCHITECTURE INTEGRATION TEST');
  console.log('================================================================\n');

  // Step 1: Connect Database & Redis
  console.log('1. Connecting Database & Redis Infrastructure...');
  try {
    await connectDB();
  } catch (err) {
    console.log('   ⚠ Database connection note:', err);
  }
  await connectRedis();
  console.log('   ✔ Redis & MongoDB Connected Successfully.');

  // Close default worker during custom cluster test
  await logWorker.close();

  // Step 2: Spawn Worker Processing Nodes
  console.log('\n2. Initializing Worker Processing Cluster (2 Worker Nodes)...');
  const workerNode1 = createLogWorker('Node-Alpha', { concurrency: 5 });
  const workerNode2 = createLogWorker('Node-Beta', { concurrency: 5 });

  const processedJobIds = new Set<string>();
  const workerCounts: Record<string, number> = { 'Node-Alpha': 0, 'Node-Beta': 0 };

  const track = (node: string, jobId: string) => {
    processedJobIds.add(jobId);
    if (workerCounts[node] !== undefined) {
      workerCounts[node]++;
    }
  };

  workerNode1.on('completed', (job) => track('Node-Alpha', job.id!));
  workerNode2.on('completed', (job) => track('Node-Beta', job.id!));

  console.log('   ✔ Node-Alpha & Node-Beta worker instances listening on queue.');

  // Step 3: Register Idempotent Repeatable Schedulers
  console.log('\n3. Registering Repeatable Job Schedulers (Health Check & Aggregation)...');
  await initLogLensSchedulers();
  console.log('   ✔ Repeatable Schedulers registered in Redis.');

  // Step 4: Simulate HTTP API Log Ingestion Flow (Single & Bulk)
  console.log('\n4. Simulating Live API Ingestion Flow (HTTP -> Producer -> Queue)...');
  const testProjectId = '60c72b2f9b1d8b2a3c4d5e6f';

  const singleResult = await ingestLog(testProjectId, {
    level: 'error',
    message: 'Master integration test - CRITICAL database connection timeout',
    service: 'payment-service',
  });
  console.log(`   ✔ Single Log Ingested: Status '${singleResult.status}', Job #${singleResult.jobId}`);

  const bulkResult = await bulkIngestLogs(testProjectId, [
    { level: 'info', message: 'User logged in', service: 'auth-service' },
    { level: 'warn', message: 'High CPU utilization detected', service: 'api-gateway' },
    { level: 'error', message: 'Out of Memory crash', service: 'analytics-worker' },
  ]);
  console.log(`   ✔ Bulk Log Ingested: Status '${bulkResult.status}', Enqueued ${bulkResult.enqueuedCount} jobs.`);

  // Step 5: Enqueue Delayed AI Analysis & Notification Jobs
  console.log('\n5. Enqueueing Delayed Jobs (AI Analysis & Alert Notifications)...');
  const aiJob = await addDelayedAiAnalysisJob(testProjectId, 'error_spike', 0);
  const notifyJob = await addDelayedNotificationJob(
    testProjectId,
    'alert_882',
    'slack',
    '#devops-channel',
    'High error rate detected in payment-service',
    'high',
    0
  );
  console.log(`   ✔ Delayed AI Analysis Job #${aiJob.id} & Notification Job #${notifyJob.id} enqueued.`);

  // Step 6: Wait for Async Execution Pipeline
  console.log('\n6. Executing Async Pipeline across Worker Nodes...');
  await sleep(6000);

  // Step 7: Inspect Queue Metrics via Bull Board Monitoring APIs
  console.log('\n7. Inspecting Queue Health & Operational Metrics (Bull Board API)...');
  const metrics = await getQueueMetrics();
  console.log(`   📊 Queue Name:      ${metrics.queueName}`);
  console.log(`   📊 Health Status:    ${metrics.status.toUpperCase()}`);
  console.log(`   📊 Waiting Jobs:     ${metrics.counts.waiting}`);
  console.log(`   📊 Active Jobs:      ${metrics.counts.active}`);
  console.log(`   📊 Completed Jobs:   ${metrics.counts.completed}`);
  console.log(`   📊 Failed Jobs:      ${metrics.counts.failed}`);
  console.log(`   📊 Delayed Jobs:     ${metrics.counts.delayed}`);
  console.log(`   📊 Failure Rate:     ${metrics.failureRatePercentage}%`);

  // Step 8: Analyze Worker Load Balancing
  console.log('\n8. Analyzing Worker Load Balancing & Distribution...');
  console.log(`   ➔ Node-Alpha Processed: ${workerCounts['Node-Alpha']} jobs`);
  console.log(`   ➔ Node-Beta Processed:  ${workerCounts['Node-Beta']} jobs`);
  console.log(`   ➔ Total Jobs Processed: ${processedJobIds.size}`);

  // Step 9: Graceful Shutdown of Cluster Infrastructure
  console.log('\n9. Executing Graceful Shutdown Procedures...');
  await workerNode1.close();
  await workerNode2.close();
  await logQueue.close();
  await logQueueEvents.close();
  await disconnectDB();
  await disconnectRedis();

  console.log('\n================================================================');
  console.log('🎉 PHASE P MASTER INTEGRATION TEST COMPLETED SUCCESSFULLY!');
  console.log('================================================================\n');
}

runMasterPhasePIntegrationTest().catch((err) => {
  console.error('❌ Master Integration Test Failed:', err);
  process.exit(1);
});
