import { Types } from 'mongoose';
import LogModel, { LogDocument, LogLevel } from '../models/Log';

export const createLog = async (payload: {
  projectId: Types.ObjectId;
  level: LogLevel;
  message: string;
  service: string;
  timestamp: Date;
  metadata?: Record<string, unknown> | undefined;
}): Promise<LogDocument> => {
  return LogModel.create(payload as any);
};

export const insertLogs = async (documents: Array<{
  projectId: Types.ObjectId;
  level: LogLevel;
  message: string;
  service: string;
  timestamp: Date;
  metadata?: Record<string, unknown> | undefined;
}>): Promise<LogDocument[]> => {
  return LogModel.insertMany(documents, { ordered: true });
};

export const countLogs = async (filter: Record<string, unknown>): Promise<number> => {
  return LogModel.countDocuments(filter).exec();
};

export const findLogs = async (
  filter: Record<string, unknown>,
  page: number,
  limit: number
): Promise<LogDocument[]> => {
  return LogModel.find(filter).sort({ timestamp: -1 }).skip((page - 1) * limit).limit(limit).lean().exec() as Promise<LogDocument[]>;
};
