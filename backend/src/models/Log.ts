import { Schema, model, Types, type Document } from 'mongoose';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'fatal';

export interface LogDocument extends Document {
  workspaceId?: Types.ObjectId;
  projectId: Types.ObjectId;
  level: LogLevel;
  message: string;
  service: string;
  metadata?: Record<string, unknown> | undefined;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Deduplication hash for AI analysis
  logHash?: string;
  // Subdocument storing the AI root-cause analysis
  aiAnalysis?: {
    summary: string;
    severity: string;
    rootCause: string;
    suggestedFix: string;
    confidence: number;
    modelUsed: string;
    analyzedAt: Date;
  };
}

const logSchema = new Schema<LogDocument>(
  {
    workspaceId: {
      type: Types.ObjectId,
      ref: 'Workspace',
      index: true,
    },
    projectId: {
      type: Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    level: {
      type: String,
      enum: ['info', 'warn', 'error', 'debug', 'fatal'],
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
    logHash: {
      type: String,
      index: true, // For fast duplicate lookups
    },
    aiAnalysis: {
      type: {
        summary: String,
        severity: String,
        rootCause: String,
        suggestedFix: String,
        confidence: Number,
        modelUsed: String,
        analyzedAt: Date,
      },
      required: false,
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

// 1. Base pagination and general count
logSchema.index({ workspaceId: 1, projectId: 1, timestamp: -1 });
logSchema.index({ projectId: 1, timestamp: -1 });

// 2. Pagination filtered by level & getLogLevels analytics
logSchema.index({ projectId: 1, level: 1, timestamp: -1 });

// 3. Pagination filtered by service & getServices analytics
logSchema.index({ projectId: 1, service: 1, timestamp: -1 });

// 4. Pagination filtered by both level and service
logSchema.index({ projectId: 1, level: 1, service: 1, timestamp: -1 });

// 5. Supports getTrends which groups by createdAt per projectId
logSchema.index({ projectId: 1, createdAt: 1 });

// 6. TTL Index for automatic log retention
const expireAfterSeconds = Number(process.env.LOG_RETENTION_DAYS || 30) * 86400;
logSchema.index({ createdAt: 1 }, { expireAfterSeconds });

// 7. Full-Text Search Index
logSchema.index(
  { message: 'text', service: 'text' },
  { weights: { message: 10, service: 5 }, name: 'log_text_index' }
);

const LogModel = model<LogDocument>('Log', logSchema);
export default LogModel;
