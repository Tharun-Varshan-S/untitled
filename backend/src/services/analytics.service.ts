import { Types } from 'mongoose';
import { AppError } from '../utils/AppError';
import LogModel from '../models/Log';

const ensureValidObjectId = (value: string): Types.ObjectId => {
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError('Invalid project id', 400, 'INVALID_PROJECT_ID');
  }
  return new Types.ObjectId(value);
};

export const getOverview = async (projectId: string) => {
  const pId = ensureValidObjectId(projectId);
  
  const [totalLogs, totalErrors, totalWarnings, uniqueServicesList] = await Promise.all([
    LogModel.countDocuments({ projectId: pId }),
    LogModel.countDocuments({ projectId: pId, level: 'error' }),
    LogModel.countDocuments({ projectId: pId, level: 'warn' }),
    LogModel.distinct('service', { projectId: pId })
  ]);

  return {
    totalLogs,
    totalErrors,
    totalWarnings,
    services: uniqueServicesList.length
  };
};

export const getLogLevels = async (projectId: string) => {
  const pId = ensureValidObjectId(projectId);
  const result = await LogModel.aggregate([
    { $match: { projectId: pId } },
    { $group: { _id: '$level', count: { $sum: 1 } } }
  ]);

  const counts: Record<string, number> = { info: 0, warn: 0, error: 0 };
  for (const item of result) {
    if (item._id && counts.hasOwnProperty(item._id)) {
      counts[item._id] = item.count;
    }
  }

  return {
    info: counts.info || 0,
    warn: counts.warn || 0,
    error: counts.error || 0
  };
};

export const getServices = async (projectId: string) => {
  const pId = ensureValidObjectId(projectId);
  const result = await LogModel.aggregate([
    { $match: { projectId: pId, service: { $ne: null } } },
    { $group: { _id: '$service', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);

  return result.map(item => ({
    service: item._id || 'unknown',
    count: item.count
  }));
};

export const getTrends = async (projectId: string) => {
  const pId = ensureValidObjectId(projectId);
  const result = await LogModel.aggregate([
    { $match: { projectId: pId } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return result.map(item => ({
    date: item._id,
    count: item.count
  }));
};
