import { Schema, model, Types, type Document } from 'mongoose';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'fatal';
export type NormalizedLevel = 'info' | 'warn' | 'error' | 'debug' | 'fatal';
export type ErrorCategory = 'database' | 'network' | 'authentication' | 'timeout' | 'validation' | 'permission' | 'unknown';
export type LogSource = 'sdk' | 'api' | 'upload' | 'unknown';
export type LogEnvironment = 'production' | 'staging' | 'development' | 'test' | 'unknown';

export interface LogDocument extends Document {
  // ── Core fields (existing) ──────────────────────────────────────────────────
  workspaceId?: Types.ObjectId;
  projectId: Types.ObjectId;
  level: LogLevel;
  message: string;
  service: string;
  metadata?: Record<string, unknown> | undefined;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;

  // ── Canonical identification fields (new) ───────────────────────────────────
  /** Distributed trace identifier for cross-service correlation */
  traceId?: string;
  /** Span identifier within a trace */
  spanId?: string;
  /** HTTP/application request identifier */
  requestId?: string;
  /** Originating host/instance */
  host?: string;
  /** Deployment environment (normalized) */
  environment?: LogEnvironment;
  /** Log ingestion source */
  source?: LogSource;

  // ── Deterministic enrichment fields (new) ──────────────────────────────────
  /** Normalized severity — guaranteed lowercase consistent enum value */
  normalizedLevel?: NormalizedLevel;
  /** Stable content fingerprint for deduplication and pattern matching */
  fingerprint?: string;
  /** Derived error category from level + message pattern analysis */
  errorCategory?: ErrorCategory;

  // ── Existing deduplication/analysis fields ──────────────────────────────────
  /** Structural hash for AI analysis deduplication */
  logHash?: string;
  /** BullMQ Job ID — used for idempotent writes (prevents duplicate docs on job retry) */
  ingestJobId?: string;
  /** Subdocument storing the AI root-cause analysis */
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
      index: true,
    },
    ingestJobId: {
      type: String,
      index: true,
      sparse: true,  // Sparse so null/undefined values don't conflict on unique constraint
      unique: true,
    },

    // ── Canonical identification fields ────────────────────────────────────────
    traceId: {
      type: String,
      index: true,
      sparse: true,
    },
    spanId: {
      type: String,
      sparse: true,
    },
    requestId: {
      type: String,
      index: true,
      sparse: true,
    },
    host: {
      type: String,
      trim: true,
    },
    environment: {
      type: String,
      enum: ['production', 'staging', 'development', 'test', 'unknown'],
    },
    source: {
      type: String,
      enum: ['sdk', 'api', 'upload', 'unknown'],
    },

    // ── Deterministic enrichment fields ────────────────────────────────────────
    normalizedLevel: {
      type: String,
      enum: ['info', 'warn', 'error', 'debug', 'fatal'],
      index: true,
    },
    fingerprint: {
      type: String,
      index: true,
      sparse: true,
    },
    errorCategory: {
      type: String,
      enum: ['database', 'network', 'authentication', 'timeout', 'validation', 'permission', 'unknown'],
      sparse: true,
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
