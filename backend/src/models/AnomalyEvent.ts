/**
 * AnomalyEvent.ts
 *
 * MongoDB model for anomaly events produced by the Isolation Forest detector.
 * Each event represents a detection result for a time window of logs for a project.
 *
 * Lifecycle: open → acknowledged → resolved
 */

import { Schema, model, Types, type Document } from 'mongoose';

export type AnomalyEventStatus = 'open' | 'acknowledged' | 'resolved';

export interface AnomalyEventDocument extends Document {
  projectId: Types.ObjectId;
  workspaceId?: Types.ObjectId;

  /** Anomaly score (0.0 - 1.0), higher = more anomalous */
  score: number;
  /** Configured detection threshold at time of detection */
  threshold: number;
  /** Whether the score exceeded the threshold */
  anomaly: boolean;

  /** Timestamp of the log window that triggered detection */
  windowTimestamp: Date;
  /** Window size in minutes */
  windowMinutes: number;
  /** Number of log records analyzed */
  sampleCount: number;

  /** Feature vector that produced this score */
  features: {
    logs_per_minute: number;
    errors_per_minute: number;
    warnings_per_minute: number;
    error_ratio: number;
    unique_services: number;
    http_4xx_count: number;
    http_5xx_count: number;
    message_entropy: number;
  };

  /** ML model identifier */
  mlModel: string;
  modelVersion: string;

  /** Non-null when detection was skipped: 'insufficient_data' | 'model_unavailable' */
  reason?: string;

  /** Lifecycle status */
  status: AnomalyEventStatus;
  /** Who acknowledged/resolved */
  resolvedBy?: string;
  resolvedAt?: Date;

  /** Reference to AI investigation (set after investigation completes) */
  investigationId?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const anomalyEventSchema = new Schema<AnomalyEventDocument>(
  {
    projectId: {
      type: Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    workspaceId: {
      type: Types.ObjectId,
      ref: 'Workspace',
      index: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    threshold: {
      type: Number,
      required: true,
    },
    anomaly: {
      type: Boolean,
      required: true,
      index: true,
    },
    windowTimestamp: {
      type: Date,
      required: true,
      index: true,
    },
    windowMinutes: {
      type: Number,
      required: true,
    },
    sampleCount: {
      type: Number,
      required: true,
    },
    features: {
      type: {
        logs_per_minute:    Number,
        errors_per_minute:  Number,
        warnings_per_minute: Number,
        error_ratio:        Number,
        unique_services:    Number,
        http_4xx_count:     Number,
        http_5xx_count:     Number,
        message_entropy:    Number,
      },
      required: true,
    },
    mlModel: {
      type: String,
      required: true,
      default: 'isolation_forest',
    },
    modelVersion: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      enum: ['insufficient_data', 'model_unavailable', null],
      sparse: true,
    },
    status: {
      type: String,
      enum: ['open', 'acknowledged', 'resolved'],
      default: 'open',
      index: true,
    },
    resolvedBy: {
      type: String,
      sparse: true,
    },
    resolvedAt: {
      type: Date,
      sparse: true,
    },
    investigationId: {
      type: Types.ObjectId,
      ref: 'Investigation',
      sparse: true,
    },
  },
  {
    timestamps: true,
    collection: 'anomalyevents',
  }
);

// Compound indexes for common query patterns
anomalyEventSchema.index({ projectId: 1, createdAt: -1 });
anomalyEventSchema.index({ projectId: 1, status: 1, createdAt: -1 });
anomalyEventSchema.index({ projectId: 1, anomaly: 1, createdAt: -1 });

const AnomalyEventModel = model<AnomalyEventDocument>('AnomalyEvent', anomalyEventSchema);

export default AnomalyEventModel;
