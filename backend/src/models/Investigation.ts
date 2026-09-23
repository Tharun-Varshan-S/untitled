/**
 * Investigation.ts
 *
 * MongoDB model for AI investigations linked to anomaly events.
 * Stores structured investigation output from the bounded AI investigator.
 *
 * Key design invariants:
 * - All fields are populated from actual LLM output, never hallucinated
 * - suspected_causes carry an explicit type: 'FACT' | 'HYPOTHESIS' | 'UNKNOWN'
 * - confidence field is required and defaults to 0.0 when evidence is insufficient
 * - unknowns list is required (empty array is valid; never omitted)
 */

import { Schema, model, Types, type Document } from 'mongoose';

export type CauseType = 'FACT' | 'HYPOTHESIS' | 'UNKNOWN';

export interface SuspectedCause {
  cause: string;
  type: CauseType;
  /** IDs of evidence logs that support this cause */
  evidenceIds: string[];
}

export interface SupportingEvidence {
  logId: string;
  relevance: string;
}

export interface TimelineEvent {
  timestamp: string; // ISO-8601
  event: string;
}

export interface InvestigationDocument extends Document {
  projectId: Types.ObjectId;
  workspaceId?: Types.ObjectId;

  /** FK to the anomaly event that triggered this investigation */
  anomalyEventId: Types.ObjectId;

  // ── Structured investigation output ────────────────────────────────────────
  /** One-sentence summary of what happened */
  summary: string;
  /** Suspected causes with epistemic classification */
  suspectedCauses: SuspectedCause[];
  /** Evidence logs and their relevance to the investigation */
  supportingEvidence: SupportingEvidence[];
  /** Reconstructed timeline of events */
  timeline: TimelineEvent[];
  /**
   * Confidence in the investigation result (0.0 - 1.0).
   * 0.0 means the model had insufficient evidence.
   * Never set to high values without supporting evidence.
   */
  confidence: number;
  /** List of things the investigator could NOT determine */
  unknowns: string[];

  // ── Metadata ────────────────────────────────────────────────────────────────
  /** Number of evidence logs that were sent to the LLM */
  evidenceCount: number;
  /** Character count of context sent to LLM (bounded at 8000) */
  contextLength: number;
  /** Groq model used for investigation */
  modelUsed: string;
  /** Whether the context was truncated */
  contextTruncated: boolean;

  /** ISO timestamp of investigation */
  investigatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const suspectedCauseSchema = new Schema<SuspectedCause>(
  {
    cause: { type: String, required: true },
    type: { type: String, enum: ['FACT', 'HYPOTHESIS', 'UNKNOWN'], required: true },
    evidenceIds: [{ type: String }],
  },
  { _id: false }
);

const supportingEvidenceSchema = new Schema<SupportingEvidence>(
  {
    logId: { type: String, required: true },
    relevance: { type: String, required: true },
  },
  { _id: false }
);

const timelineEventSchema = new Schema<TimelineEvent>(
  {
    timestamp: { type: String, required: true },
    event: { type: String, required: true },
  },
  { _id: false }
);

const investigationSchema = new Schema<InvestigationDocument>(
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
    anomalyEventId: {
      type: Types.ObjectId,
      ref: 'AnomalyEvent',
      required: true,
      index: true,
    },
    summary: {
      type: String,
      required: true,
    },
    suspectedCauses: [suspectedCauseSchema],
    supportingEvidence: [supportingEvidenceSchema],
    timeline: [timelineEventSchema],
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
      default: 0.0,
    },
    unknowns: [{ type: String }],
    evidenceCount: { type: Number, required: true },
    contextLength: { type: Number, required: true },
    modelUsed: { type: String, required: true },
    contextTruncated: { type: Boolean, required: true, default: false },
    investigatedAt: { type: Date, required: true, default: () => new Date() },
  },
  {
    timestamps: true,
    collection: 'investigations',
  }
);

investigationSchema.index({ projectId: 1, createdAt: -1 });
investigationSchema.index({ anomalyEventId: 1 }, { unique: true });

const InvestigationModel = model<InvestigationDocument>('Investigation', investigationSchema);

export default InvestigationModel;
