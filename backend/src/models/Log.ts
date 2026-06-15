import { Schema, model, Types, type Document } from 'mongoose';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogDocument extends Document {
  projectId: Types.ObjectId;
  level: LogLevel;
  message: string;
  service: string;
  metadata?: Record<string, unknown> | undefined;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const logSchema = new Schema<LogDocument>(
  {
    projectId: {
      type: Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    level: {
      type: String,
      enum: ['info', 'warn', 'error', 'debug'],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    service: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
    timestamp: {
      type: Date,
      default: () => new Date(),
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        const output = ret as Record<string, unknown>;
        output.id = output._id?.toString();
        delete output._id;
        delete output.__v;
      },
    },
  }
);

logSchema.index({ projectId: 1, timestamp: -1 });
logSchema.index({ projectId: 1, level: 1 });
logSchema.index({ projectId: 1, service: 1 });
logSchema.index({ projectId: 1, level: 1, service: 1, timestamp: -1 });
// Supports getTrends which groups by createdAt per projectId
logSchema.index({ projectId: 1, createdAt: 1 });

const LogModel = model<LogDocument>('Log', logSchema);
export default LogModel;
