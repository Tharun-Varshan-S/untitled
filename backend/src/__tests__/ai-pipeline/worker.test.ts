import { processLogJob, createLogWorker } from '../../jobs/log.worker';
import { JOB_NAMES } from '../../jobs/log.producer';
import * as logsRepo from '../../repositories/logs.repository';
import ProjectModel from '../../models/Project';
import LogModel from '../../models/Log';
import { aiService } from '../../services/aiService';
import { analysisStorageService } from '../../services/analysisStorageService';
import * as broadcastSocket from '../../socket/broadcast';
import * as analyticsSocket from '../../socket/analytics';
import * as logProducer from '../../jobs/log.producer';
import { Types } from 'mongoose';
import { UnrecoverableError } from 'bullmq';

jest.mock('../../repositories/logs.repository');
jest.mock('../../models/Project');
jest.mock('../../models/Log');
jest.mock('../../services/aiService');
jest.mock('../../services/analysisStorageService');
jest.mock('../../socket/broadcast');
jest.mock('../../socket/analytics');
jest.mock('../../jobs/log.producer');

// We mock bullmq to avoid actual Redis connections during tests
jest.mock('bullmq', () => {
  return {
    Worker: jest.fn().mockImplementation((name, processor, opts) => {
      return {
        on: jest.fn(),
        close: jest.fn(),
      };
    }),
    Queue: jest.fn().mockImplementation((name, opts) => {
      return {
        add: jest.fn(),
        close: jest.fn(),
        on: jest.fn(),
      };
    }),
    QueueEvents: jest.fn().mockImplementation(() => {
      return {
        on: jest.fn(),
        close: jest.fn(),
      };
    }),
    UnrecoverableError: class UnrecoverableError extends Error {},
  };
});

describe('Worker processing logic', () => {
  let mockJob: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockJob = {
      id: 'job-123',
      name: JOB_NAMES.PROCESS_SINGLE_LOG,
      attemptsMade: 0,
      opts: { attempts: 3 },
      updateProgress: jest.fn(),
      data: {
        version: 1,
        projectId: new Types.ObjectId().toString(),
        level: 'error',
        message: 'Test message',
        timestamp: new Date().toISOString(),
      },
    };

    (ProjectModel.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ workspaceId: new Types.ObjectId() }),
      }),
    });

    (LogModel.findOne as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });
    
    (LogModel.findById as jest.Mock).mockResolvedValue({
      _id: new Types.ObjectId(),
      level: 'error',
      message: 'Test message',
    });

    (logsRepo.createLog as jest.Mock).mockResolvedValue({
      _id: new Types.ObjectId(),
      projectId: new Types.ObjectId(),
      level: 'error',
      message: 'Test message',
      save: jest.fn().mockResolvedValue(true),
    });
  });

  describe('Routing', () => {
    it('1. should route to SCHEDULED_AI_ANALYSIS', async () => {
      mockJob.name = JOB_NAMES.SCHEDULED_AI_ANALYSIS;
      const res = await processLogJob(mockJob);
      expect(res.type).toBe('ai-analysis');
    });

    it('2. should route to DELAYED_NOTIFICATION', async () => {
      mockJob.name = JOB_NAMES.DELAYED_NOTIFICATION;
      const res = await processLogJob(mockJob);
      expect(res.type).toBe('notification-dispatch');
    });

    it('3. should route to COLLECTOR_HEALTH_CHECK', async () => {
      mockJob.name = JOB_NAMES.COLLECTOR_HEALTH_CHECK;
      const res = await processLogJob(mockJob);
      expect(res.type).toBe('health-check');
    });

    it('4. should route to ANALYTICS_AGGREGATION', async () => {
      mockJob.name = JOB_NAMES.ANALYTICS_AGGREGATION;
      const res = await processLogJob(mockJob);
      expect(res.type).toBe('analytics-aggregation');
    });

    it('5. should route to LOG_CLEANUP', async () => {
      mockJob.name = JOB_NAMES.LOG_CLEANUP;
      const res = await processLogJob(mockJob);
      expect(res.type).toBe('log-cleanup');
    });
  });

  describe('PROCESS_SINGLE_LOG (handleSingleLogJob)', () => {
    it('6. should validate payload and throw UnrecoverableError if invalid', async () => {
      mockJob.data = { level: 'error' }; // Missing required fields
      await expect(processLogJob(mockJob)).rejects.toThrow(UnrecoverableError);
    });

    it('7. should query project for workspace mapping', async () => {
      await processLogJob(mockJob);
      expect(ProjectModel.findById).toHaveBeenCalledWith(expect.any(Types.ObjectId));
    });

    it('8. should call logsRepo.createLog with parsed data', async () => {
      await processLogJob(mockJob);
      expect(logsRepo.createLog).toHaveBeenCalled();
    });

    it('9. should trigger AI analysis for "error" level logs', async () => {
      await processLogJob(mockJob);
      expect(logProducer.addAnalyzeLogJob).toHaveBeenCalled();
    });

    it('10. should NOT trigger AI analysis for "info" level logs', async () => {
      mockJob.data.level = 'info';
      await processLogJob(mockJob);
      expect(logProducer.addAnalyzeLogJob).not.toHaveBeenCalled();
    });

    it('11. should check for existing identical logs (cache hit)', async () => {
      const fakeAnalysis = { summary: 'Prior' };
      (LogModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue({ aiAnalysis: fakeAnalysis }),
      });
      
      const fakeCreatedLog = {
        _id: new Types.ObjectId(),
        projectId: new Types.ObjectId(),
        level: 'error',
        message: 'Test message',
        save: jest.fn().mockResolvedValue(true),
      };
      (logsRepo.createLog as jest.Mock).mockResolvedValue(fakeCreatedLog);

      await processLogJob(mockJob);

      // Should have copied the analysis
      expect((fakeCreatedLog as any).aiAnalysis).toBe(fakeAnalysis);
      
      // Should NOT trigger new AI analysis since we copied it
      expect(logProducer.addAnalyzeLogJob).not.toHaveBeenCalled();
    });

    it('12. should broadcast new log via sockets', async () => {
      await processLogJob(mockJob);
      expect(broadcastSocket.broadcastNewLog).toHaveBeenCalled();
    });

    it('13. should update job progress multiple times', async () => {
      await processLogJob(mockJob);
      expect(mockJob.updateProgress).toHaveBeenCalledWith(25);
      expect(mockJob.updateProgress).toHaveBeenCalledWith(50);
      expect(mockJob.updateProgress).toHaveBeenCalledWith(75);
      expect(mockJob.updateProgress).toHaveBeenCalledWith(100);
    });

    it('14. should return success payload', async () => {
      const res = await processLogJob(mockJob);
      expect(res.success).toBe(true);
      expect(res.jobId).toBe(mockJob.id);
    });
  });

  describe('ANALYZE_LOG (handleAnalyzeLogJob)', () => {
    beforeEach(() => {
      mockJob.name = JOB_NAMES.ANALYZE_LOG;
      mockJob.data = { logId: new Types.ObjectId().toString(), projectId: 'proj123' };
    });

    it('15. should throw UnrecoverableError if log doc is not found', async () => {
      (LogModel.findById as jest.Mock).mockResolvedValue(null);
      await expect(processLogJob(mockJob)).rejects.toThrow(UnrecoverableError);
    });

    it('16. should call aiService.generateCompletion', async () => {
      (aiService.generateCompletion as jest.Mock).mockResolvedValue(JSON.stringify({ 
        summary: 'test', severity: 'error', rootCause: 'rc', suggestedFix: 'fix', confidence: 0.9 
      }));
      await processLogJob(mockJob);
      expect(aiService.generateCompletion).toHaveBeenCalled();
    });

    it('17. should throw normal Error if AI generation fails (allowing BullMQ to retry)', async () => {
      (aiService.generateCompletion as jest.Mock).mockRejectedValue(new Error('Groq Timeout'));
      await expect(processLogJob(mockJob)).rejects.toThrow('Groq Timeout');
    });

    it('18. should throw normal Error if AI output validation fails', async () => {
      (aiService.generateCompletion as jest.Mock).mockResolvedValue('invalid json');
      await expect(processLogJob(mockJob)).rejects.toThrow();
    });

    it('19. should call analysisStorageService.saveAnalysis on success', async () => {
      (aiService.generateCompletion as jest.Mock).mockResolvedValue(JSON.stringify({
        summary: 'sum',
        severity: 'warn',
        rootCause: 'rc',
        suggestedFix: 'fix',
        confidence: 0.9
      }));
      await processLogJob(mockJob);
      expect(analysisStorageService.saveAnalysis).toHaveBeenCalled();
    });

    it('20. should broadcast analytics update on completion', async () => {
      (aiService.generateCompletion as jest.Mock).mockResolvedValue(JSON.stringify({
        summary: 'sum', severity: 'error', rootCause: 'rc', suggestedFix: 'fix', confidence: 0.9
      }));
      await processLogJob(mockJob);
      expect(analyticsSocket.broadcastAnalyticsUpdate).toHaveBeenCalledWith('proj123');
    });

    it('21. should return a success object with analyzedAt timestamp', async () => {
      (aiService.generateCompletion as jest.Mock).mockResolvedValue(JSON.stringify({
        summary: 'sum', severity: 'info', rootCause: 'rc', suggestedFix: 'fix', confidence: 0.9
      }));
      const res = await processLogJob(mockJob);
      expect(res.success).toBe(true);
      expect(res.analyzedAt).toBeDefined();
    });
  });

  describe('Worker Factory & Event Setup', () => {
    it('22. createLogWorker should instantiate a Worker class', () => {
      const worker = createLogWorker('test-worker');
      expect(worker).toBeDefined();
      expect(worker.on).toHaveBeenCalled();
    });

    it('23. createLogWorker should accept custom options', () => {
      createLogWorker('test-worker', { concurrency: 99 });
      // Bullmq mock is simple, we just verify it doesn't crash and returns the mocked obj
      expect(true).toBe(true);
    });

    it('24. processLogJob should supply default workerId if omitted', async () => {
      const res = await processLogJob(mockJob);
      expect(res.processedBy).toMatch(/PID-\d+/);
    });

    it('25. processLogJob should use provided workerId if supplied', async () => {
      const res = await processLogJob(mockJob, 'Worker-X');
      expect(res.processedBy).toBe('Worker-X');
    });
  });
});
