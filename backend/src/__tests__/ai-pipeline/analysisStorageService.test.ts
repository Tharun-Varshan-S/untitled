import { analysisStorageService } from '../../services/analysisStorageService';
import LogModel from '../../models/Log';
import { logger } from '../../utils/logger';

// Mock the LogModel
jest.mock('../../models/Log', () => ({
  __esModule: true,
  default: {
    findByIdAndUpdate: jest.fn(),
  },
}));

// Mock logger to prevent actual logging during tests
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Analysis Storage Service', () => {
  const mockAnalysis = {
    summary: 'A test summary',
    severity: 'error' as const,
    rootCause: 'Test root cause',
    suggestedFix: 'Fix it',
    confidence: 0.9,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveAnalysis - Success Paths', () => {
    it('1. should call findByIdAndUpdate with correct logId', async () => {
      (LogModel.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce({ _id: 'log123' });
      await analysisStorageService.saveAnalysis('log123', mockAnalysis, 'model-v1');
      expect(LogModel.findByIdAndUpdate).toHaveBeenCalledWith('log123', expect.any(Object), expect.any(Object));
    });

    it('2. should set the aiAnalysis nested object correctly', async () => {
      (LogModel.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce({ _id: 'log123' });
      await analysisStorageService.saveAnalysis('log123', mockAnalysis, 'model-v1');
      
      const updateObject = (LogModel.findByIdAndUpdate as jest.Mock).mock.calls[0][1];
      expect(updateObject.$set.aiAnalysis).toMatchObject({
        summary: 'A test summary',
        severity: 'error',
        rootCause: 'Test root cause',
        suggestedFix: 'Fix it',
        confidence: 0.9,
      });
    });

    it('3. should append the modelUsed correctly', async () => {
      (LogModel.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce({ _id: 'log123' });
      await analysisStorageService.saveAnalysis('log123', mockAnalysis, 'model-x');
      const updateObject = (LogModel.findByIdAndUpdate as jest.Mock).mock.calls[0][1];
      expect(updateObject.$set.aiAnalysis.modelUsed).toBe('model-x');
    });

    it('4. should append the analyzedAt timestamp as a Date object', async () => {
      (LogModel.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce({ _id: 'log123' });
      await analysisStorageService.saveAnalysis('log123', mockAnalysis, 'model-v1');
      const updateObject = (LogModel.findByIdAndUpdate as jest.Mock).mock.calls[0][1];
      expect(updateObject.$set.aiAnalysis.analyzedAt).toBeInstanceOf(Date);
    });

    it('5. should ask mongoose to return the new (updated) document', async () => {
      (LogModel.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce({ _id: 'log123' });
      await analysisStorageService.saveAnalysis('log123', mockAnalysis, 'model-v1');
      const optionsObject = (LogModel.findByIdAndUpdate as jest.Mock).mock.calls[0][2];
      expect(optionsObject).toEqual({ new: true });
    });

    it('6. should not create a new document if it does not exist (no upsert flag)', async () => {
      (LogModel.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce(null);
      
      // If it throws, we know it didn't just quietly upsert
      await expect(analysisStorageService.saveAnalysis('nonexistent', mockAnalysis, 'm')).rejects.toThrow();
      
      const optionsObject = (LogModel.findByIdAndUpdate as jest.Mock).mock.calls[0][2];
      expect(optionsObject.upsert).toBeUndefined(); // Upsert is not requested
    });

    it('7. should log an info message on success', async () => {
      (LogModel.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce({ _id: 'log123' });
      await analysisStorageService.saveAnalysis('log123', mockAnalysis, 'model-v1');
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Successfully saved AI analysis'));
    });
  });

  describe('saveAnalysis - Edge Cases & Content Variations', () => {
    const severities = ['info', 'warn', 'error', 'fatal'] as const;
    
    // Generates 4 test cases (8-11)
    severities.forEach((sev, index) => {
      it(`${8 + index}. should properly save with severity: ${sev}`, async () => {
        (LogModel.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce({ _id: 'log123' });
        await analysisStorageService.saveAnalysis('log123', { ...mockAnalysis, severity: sev }, 'model');
        const updateObject = (LogModel.findByIdAndUpdate as jest.Mock).mock.calls[0][1];
        expect(updateObject.$set.aiAnalysis.severity).toBe(sev);
      });
    });

    it('12. should handle a confidence level of exactly 0', async () => {
      (LogModel.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce({ _id: 'log123' });
      await analysisStorageService.saveAnalysis('log123', { ...mockAnalysis, confidence: 0 }, 'model');
      const updateObject = (LogModel.findByIdAndUpdate as jest.Mock).mock.calls[0][1];
      expect(updateObject.$set.aiAnalysis.confidence).toBe(0);
    });

    it('13. should handle a confidence level of exactly 1', async () => {
      (LogModel.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce({ _id: 'log123' });
      await analysisStorageService.saveAnalysis('log123', { ...mockAnalysis, confidence: 1 }, 'model');
      const updateObject = (LogModel.findByIdAndUpdate as jest.Mock).mock.calls[0][1];
      expect(updateObject.$set.aiAnalysis.confidence).toBe(1);
    });

    it('14. should save even with an extremely long summary', async () => {
      (LogModel.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce({ _id: 'log123' });
      const longSummary = 'A'.repeat(5000);
      await analysisStorageService.saveAnalysis('log123', { ...mockAnalysis, summary: longSummary }, 'model');
      const updateObject = (LogModel.findByIdAndUpdate as jest.Mock).mock.calls[0][1];
      expect(updateObject.$set.aiAnalysis.summary).toBe(longSummary);
    });
    
    it('15. should handle an empty model string', async () => {
      (LogModel.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce({ _id: 'log123' });
      await analysisStorageService.saveAnalysis('log123', mockAnalysis, '');
      const updateObject = (LogModel.findByIdAndUpdate as jest.Mock).mock.calls[0][1];
      expect(updateObject.$set.aiAnalysis.modelUsed).toBe('');
    });
  });

  describe('saveAnalysis - Failure Paths', () => {
    it('16. should throw if findByIdAndUpdate returns null (document not found)', async () => {
      (LogModel.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce(null);
      await expect(analysisStorageService.saveAnalysis('log999', mockAnalysis, 'm')).rejects.toThrow('Log document with ID log999 not found');
    });

    it('17. should log an error if document is not found', async () => {
      (LogModel.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce(null);
      try {
        await analysisStorageService.saveAnalysis('log999', mockAnalysis, 'm');
      } catch (e) {
        // Ignore
      }
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to save AI analysis for log log999'));
    });

    it('18. should bubble up mongoose connection errors directly', async () => {
      const dbError = new Error('MongoTimeout');
      (LogModel.findByIdAndUpdate as jest.Mock).mockRejectedValueOnce(dbError);
      await expect(analysisStorageService.saveAnalysis('log123', mockAnalysis, 'm')).rejects.toThrow('MongoTimeout');
    });

    it('19. should log an error when mongoose throws', async () => {
      (LogModel.findByIdAndUpdate as jest.Mock).mockRejectedValueOnce(new Error('NetworkError'));
      try {
        await analysisStorageService.saveAnalysis('log123', mockAnalysis, 'm');
      } catch (e) {
        // Ignore
      }
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('NetworkError'));
    });

    it('20. should not mask the original stack trace of a thrown error', async () => {
      const dbError = new Error('Deep DB Error');
      (LogModel.findByIdAndUpdate as jest.Mock).mockRejectedValueOnce(dbError);
      
      try {
        await analysisStorageService.saveAnalysis('log123', mockAnalysis, 'm');
        fail('Should have thrown');
      } catch (e: any) {
        expect(e).toBe(dbError);
        expect(e.stack).toBeDefined();
      }
    });
  });
});
