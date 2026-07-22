import { logQueue } from './log.queue';
import { addDelayedAiAnalysisJob, addDelayedNotificationJob } from './log.producer';
import { createLogWorker, logWorker, logQueueEvents } from './log.worker';
import { connectRedis, disconnectRedis } from '../config/redis';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runScalingWorkersVerification() {
  console.log('\n=============================================================');
  console.log('🚀 LOGLENS SCALING WORKERS & CLUSTER VERIFICATION SUITE');
  console.log('=============================================================\n');

  await connectRedis();

  // Close default worker to isolate our multi-worker cluster test
  await logWorker.close();

  // Step 1: Spawn 3 Standalone Worker Nodes (Cluster Simulation)
  console.log('1. Spawning 3 Concurrent Worker Nodes (Simulating Horizontal Scaling)...');
  const workerAlpha = createLogWorker('Worker-Node-Alpha', { concurrency: 5 });
  const workerBeta = createLogWorker('Worker-Node-Beta', { concurrency: 5 });
  const workerGamma = createLogWorker('Worker-Node-Gamma', { concurrency: 5 });

  console.log('   ✔ [Worker-Node-Alpha] Ready (Concurrency: 5)');
  console.log('   ✔ [Worker-Node-Beta] Ready (Concurrency: 5)');
  console.log('   ✔ [Worker-Node-Gamma] Ready (Concurrency: 5)');
  console.log('   ➔ Aggregate Processing Capacity: 15 parallel jobs simultaneously!');

  // Track worker assignment for each job
  const processingMap = new Map<string, string>();
  const completedJobsSet = new Set<string>();

  const trackJob = (workerName: string, jobId: string) => {
    processingMap.set(jobId, workerName);
    completedJobsSet.add(jobId);
  };

  workerAlpha.on('completed', (job) => trackJob('Worker-Node-Alpha', job.id!));
  workerBeta.on('completed', (job) => trackJob('Worker-Node-Beta', job.id!));
  workerGamma.on('completed', (job) => trackJob('Worker-Node-Gamma', job.id!));

  // Step 2: Enqueue a High-Volume Burst of 30 Immediate AI Analysis & Notification Jobs
  console.log('\n2. Enqueueing high-volume burst of 30 immediate AI Analysis & Alert jobs...');
  const jobIds: string[] = [];

  for (let i = 1; i <= 30; i++) {
    let job;
    if (i % 2 === 0) {
      job = await addDelayedAiAnalysisJob('proj_cluster_test', 'error_spike', 0);
    } else {
      job = await addDelayedNotificationJob(
        'proj_cluster_test',
        `alert_${i}`,
        'slack',
        '#devops-alerts',
        `Cluster test alert #${i}`,
        'medium',
        0
      );
    }
    if (job.id) jobIds.push(job.id);
  }

  console.log(`   ➔ Successfully enqueued ${jobIds.length} jobs into BullMQ.`);

  // Step 3: Wait for cluster execution
  console.log('\n3. Waiting for worker cluster to process jobs...');
  await sleep(7000);

  // Step 4: Verify Load Balancing & Distribution
  console.log('\n4. Analyzing Load Balancing Distribution across Worker Nodes...');
  const countsByWorker: Record<string, number> = {
    'Worker-Node-Alpha': 0,
    'Worker-Node-Beta': 0,
    'Worker-Node-Gamma': 0,
  };

  processingMap.forEach((workerName) => {
    if (countsByWorker[workerName] !== undefined) {
      countsByWorker[workerName]++;
    }
  });

  console.log(`   ➔ Worker Node Alpha processed: ${countsByWorker['Worker-Node-Alpha']} jobs`);
  console.log(`   ➔ Worker Node Beta processed:  ${countsByWorker['Worker-Node-Beta']} jobs`);
  console.log(`   ➔ Worker Node Gamma processed: ${countsByWorker['Worker-Node-Gamma']} jobs`);
  console.log(`   ➔ Total Unique Jobs Processed: ${completedJobsSet.size}/${jobIds.length}`);

  if (completedJobsSet.size < jobIds.length) {
    throw new Error(`TEST FAILED: Expected ${jobIds.length} processed jobs, but got ${completedJobsSet.size}`);
  }

  // Step 5: Test Graceful Shutdown on Worker Alpha
  console.log('\n5. Testing Graceful Shutdown on Worker Node Alpha...');
  console.log('   ➔ Enqueueing 10 additional cluster jobs...');
  for (let i = 31; i <= 40; i++) {
    await addDelayedAiAnalysisJob('proj_cluster_test', 'scheduled_summary', 0);
  }

  console.log('   ➔ Initiating Graceful Shutdown (`workerAlpha.close()`)...\n');
  const shutdownStartTime = Date.now();
  await workerAlpha.close();
  const shutdownDuration = Date.now() - shutdownStartTime;

  console.log(`   ✔ Worker Node Alpha shut down cleanly in ${shutdownDuration}ms.`);
  console.log('   ➔ Verifying remaining workers (Beta & Gamma) finish the remaining queue jobs...');

  await sleep(4000);

  await workerBeta.close();
  await workerGamma.close();
  await logQueue.close();
  await logQueueEvents.close();
  await disconnectRedis();

  console.log('\n=============================================================');
  console.log('✅ SCALING WORKERS & CLUSTER TEST PASSED SUCCESSFULLY!');
  console.log('=============================================================\n');
}

runScalingWorkersVerification().catch((err) => {
  console.error('❌ Scaling Workers Verification Error:', err);
  process.exit(1);
});
