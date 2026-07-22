import request from 'supertest';
import app from '../app';
import { logQueue } from '../jobs/log.queue';
import { logWorker } from '../jobs/log.worker';
import { getQueueMetrics } from '../jobs/log.monitoring';

describe('Queue Monitoring Integration & API Tests', () => {
  afterAll(async () => {
    await logWorker.close();
    await logQueue.close();
  });

  it('should return queue metrics from getQueueMetrics() inspection helper', async () => {
    const metrics = await getQueueMetrics();
    expect(metrics).toBeDefined();
    expect(metrics.queueName).toBe('log-ingestion');
    expect(metrics.counts).toHaveProperty('waiting');
    expect(metrics.counts).toHaveProperty('active');
    expect(metrics.counts).toHaveProperty('completed');
    expect(metrics.counts).toHaveProperty('failed');
    expect(metrics.counts).toHaveProperty('delayed');
    expect(metrics.status).toBeDefined();
  });

  it('should serve GET /api/v1/queues/metrics endpoint', async () => {
    const response = await request(app).get('/api/v1/queues/metrics');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.queueName).toBe('log-ingestion');
    expect(response.body.data.counts).toBeDefined();
  });

  it('should serve GET /api/v1/queues/failed endpoint', async () => {
    const response = await request(app).get('/api/v1/queues/failed?limit=5');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('should mount Bull Board Dashboard UI at /admin/queues', async () => {
    const response = await request(app).get('/admin/queues');
    // Bull Board responds with 200 or 302 redirect to /admin/queues/
    expect([200, 302]).toContain(response.status);
  });
});
