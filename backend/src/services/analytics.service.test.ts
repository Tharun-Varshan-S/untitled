import { Types } from 'mongoose';
import { getOverview, getTrends } from './analytics.service';
import LogModel from '../models/Log';
import { AppError } from '../utils/AppError';

// Mock the LogModel
jest.mock('../models/Log');

describe('Analytics Service', () => {
  const mockProjectId = new Types.ObjectId().toString();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOverview', () => {
    it('should throw AppError if projectId is invalid', async () => {
      await expect(getOverview('invalid-id')).rejects.toThrow(AppError);
    });

    it('should return aggregated overview metrics including logsPerMinute', async () => {
      const mockCount = jest.fn().mockResolvedValue(10);
      const mockDistinct = jest.fn().mockResolvedValue(['serviceA', 'serviceB']);
      
      LogModel.countDocuments = mockCount;
      LogModel.distinct = mockDistinct;

      const result = await getOverview(mockProjectId);

      expect(result).toEqual({
        totalLogs: 10,
        totalErrors: 10,
        totalWarnings: 10,
        services: 2,
        logsPerMinute: 10
      });
      
      // Should be called 4 times total for countDocuments
      expect(LogModel.countDocuments).toHaveBeenCalledTimes(4);
      expect(LogModel.distinct).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTrends', () => {
    it('should default to day granularity', async () => {
      const mockAggregate = jest.fn().mockResolvedValue([
        { _id: '2023-01-01', count: 5 }
      ]);
      LogModel.aggregate = mockAggregate;

      const result = await getTrends(mockProjectId);
      
      expect(result).toEqual([{ date: '2023-01-01', count: 5 }]);
      expect(mockAggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 }
            }
          }
        ])
      );
    });

    it('should use hour granularity when specified', async () => {
      const mockAggregate = jest.fn().mockResolvedValue([
        { _id: '2023-01-01 10:00', count: 5 }
      ]);
      LogModel.aggregate = mockAggregate;

      const result = await getTrends(mockProjectId, 'hour');
      
      expect(result).toEqual([{ date: '2023-01-01 10:00', count: 5 }]);
      expect(mockAggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d %H:00', date: '$createdAt' } },
              count: { $sum: 1 }
            }
          }
        ])
      );
    });

    it('should use minute granularity when specified', async () => {
      const mockAggregate = jest.fn().mockResolvedValue([
        { _id: '2023-01-01 10:30', count: 5 }
      ]);
      LogModel.aggregate = mockAggregate;

      const result = await getTrends(mockProjectId, 'minute');
      
      expect(result).toEqual([{ date: '2023-01-01 10:30', count: 5 }]);
      expect(mockAggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d %H:%M', date: '$createdAt' } },
              count: { $sum: 1 }
            }
          }
        ])
      );
    });
  });
});
