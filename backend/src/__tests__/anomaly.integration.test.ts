import { describe, it, expect, beforeAll } from '@jest/globals';
import axios from 'axios';
import { config } from '../config/env';

// This test requires the loglens-ai Python service to be running.
describe('Anomaly & AI Integration Tests (loglens-ai)', () => {
  const AI_SERVICE_URL = config.aiServiceUrl || 'http://localhost:8000';
  const SERVICE_KEY = config.serviceKey || 'dev-service-key';
  
  let isServiceRunning = false;

  beforeAll(async () => {
    try {
      // Check if the service is up. 
      // We can use a simple GET to /api/v1/anomaly/status or /health
      const res = await axios.get(`${AI_SERVICE_URL}/health`, {
          validateStatus: (status) => status < 500
      });
      isServiceRunning = true;
    } catch (e) {
      console.warn(`Python AI service is not reachable at ${AI_SERVICE_URL}. Skipping AI integration tests.`);
    }
  });

  it('should train an isolation forest model', async () => {
    if (!isServiceRunning) return;

    const projectId = 'integration-test-project';
    // Generate synthetic logs (minimum 50 required based on TrainRequest schema)
    const logs = Array.from({ length: 60 }).map((_, i) => ({
      level: 'info',
      message: `User ${i} logged in successfully`,
      service: 'auth-service',
      timestamp: new Date().toISOString()
    }));

    const res = await axios.post(
      `${AI_SERVICE_URL}/api/v1/anomaly/train`,
      {
        projectId,
        logs,
        windowMinutes: 5
      },
      {
        headers: { 'X-Service-Key': SERVICE_KEY }
      }
    );

    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.sampleCount).toBeGreaterThan(0);
  });

  it('should detect anomalies using the trained model', async () => {
    if (!isServiceRunning) return;

    const projectId = 'integration-test-project';
    const newLogs = [
      {
        level: 'error',
        message: 'Database connection failed FATAL crash',
        service: 'db-service',
        timestamp: new Date().toISOString()
      }
    ];

    const res = await axios.post(
      `${AI_SERVICE_URL}/api/v1/anomaly/detect`,
      {
        projectId,
        logs: newLogs,
        windowMinutes: 5
      },
      {
        headers: { 'X-Service-Key': SERVICE_KEY }
      }
    );

    expect(res.status).toBe(200);
    expect(res.data.anomaly).toBeDefined();
    expect(res.data.score).toBeGreaterThanOrEqual(0);
  });
  
  it('should analyze log using the /analyze endpoint', async () => {
    if (!isServiceRunning) return;

    const projectId = 'integration-test-project';
    const logString = "Error: Database connection timeout at auth-service after 5000ms";

    const res = await axios.post(
      `${AI_SERVICE_URL}/analyze`,
      {
        workspaceId: 'workspace-1',
        projectId,
        logs: [logString]
      },
      {
        headers: { 'X-Service-Key': SERVICE_KEY }
      }
    );

    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.summary).toBeDefined();
    expect(res.data.rootCause).toBeDefined();
  });
  
  it('should investigate evidence using the /api/v1/investigate endpoint', async () => {
    if (!isServiceRunning) return;

    const projectId = 'integration-test-project';
    
    const evidenceLogs = [
      {
        id: '1',
        level: 'error',
        message: 'Database connection timeout',
        service: 'db',
        timestamp: new Date().toISOString()
      }
    ];

    const res = await axios.post(
      `${AI_SERVICE_URL}/api/v1/investigate`,
      {
        projectId,
        anomalyScore: 0.85,
        windowMinutes: 5,
        evidenceLogs,
        rationale: []
      },
      {
        headers: { 'X-Service-Key': SERVICE_KEY }
      }
    );

    expect(res.status).toBe(200);
    expect(res.data.projectId).toBe(projectId);
    expect(res.data.summary).toBeDefined();
    expect(res.data.confidence).toBeGreaterThanOrEqual(0);
  });
});
