import { Types } from 'mongoose';
import LogModel, { LogDocument, LogLevel } from '../models/Log';

type CreateLogPayload = {
  workspaceId?: Types.ObjectId | undefined;
  projectId: Types.ObjectId;
  level: LogLevel;
  message: string;
  service: string;
  timestamp: Date;
  metadata?: Record<string, unknown> | undefined;
  /** BullMQ Job ID for idempotency. When set, uses upsert to prevent duplicate docs on retry. */
  ingestJobId?: string;
};

export const createLog = async (payload: CreateLogPayload): Promise<LogDocument> => {
  if (payload.ingestJobId) {
    // Idempotent path: if the same BullMQ job is retried, don't create a second document.
    const { ingestJobId, ...rest } = payload;
    const doc = await LogModel.findOneAndUpdate(
      { ingestJobId },
      { $setOnInsert: { ...rest, ingestJobId } },
      { upsert: true, new: true }
    );
    return doc as LogDocument;
  }
  return LogModel.create(payload as any);
};


export const insertLogs = async (documents: Array<{
  workspaceId?: Types.ObjectId | undefined;
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
