/**
 * evidenceRetrieval.service.ts
 *
 * Responsibility:
 * Gathers relevant log evidence around an anomaly event for AI investigation.
 *
 * Design decisions:
 * - Evidence is fetched from Elasticsearch (with MongoDB fallback)
 * - Hard cap of 50 log records regardless of query size (prevents context overflow)
 * - Each included log record comes with a rationale explaining WHY it was included
 * - TraceId-based correlation when available
 * - Deduplication by fingerprint to reduce noise
 * - No LLM calls — this is purely structural retrieval
 */

import { Types } from 'mongoose';
import { getElasticsearchClient, isElasticsearchAvailable } from '../config/elasticsearch';
import { getIndexName } from './elasticsearch.service';
import { logger } from '../utils/logger';
import LogModel from '../models/Log';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EvidenceLog {
  id: string;
  level: string;
  message: string;
  service: string;
  timestamp: string;
  traceId?: string;
  requestId?: string;
  environment?: string;
  errorCategory?: string;
  fingerprint?: string;
  metadata?: Record<string, unknown>;
}

export interface EvidenceRationale {
  logId: string;
  reason: string;
}

export interface EvidenceResult {
  logs: EvidenceLog[];
  rationale: EvidenceRationale[];
  totalFound: number;
  cappedAt: number;
}

export interface EvidenceOptions {
  projectId: string;
  anomalyTimestamp: Date;
  /** Minutes before anomaly to include */
  windowBeforeMinutes?: number;
  /** Minutes after anomaly to include */
  windowAfterMinutes?: number;
  /** If provided, include all logs sharing this traceId */
  traceId?: string;
  /** If provided, filter to this service */
  service?: string;
  /** Max logs to return — hard-capped at 50 */
  maxLogs?: number;
}

const HARD_CAP = 50;
const DEFAULT_WINDOW_BEFORE = 5;
const DEFAULT_WINDOW_AFTER = 2;

// ── Main retrieval function ───────────────────────────────────────────────────

/**
 * Retrieves relevant evidence logs around an anomaly event.
 *
 * Retrieval strategy (in priority order):
 * 1. Logs sharing the same traceId (if available) — highest signal
 * 2. Error/fatal logs in the ±window around anomaly timestamp
 * 3. Warn logs in the same window if capacity remains
 *
 * All logs are deduplicated by fingerprint before returning.
 */
export async function retrieveEvidence(options: EvidenceOptions): Promise<EvidenceResult> {
  const {
    projectId,
    anomalyTimestamp,
    windowBeforeMinutes = DEFAULT_WINDOW_BEFORE,
    windowAfterMinutes = DEFAULT_WINDOW_AFTER,
    traceId,
    service,
    maxLogs = HARD_CAP,
  } = options;

  const cap = Math.min(maxLogs, HARD_CAP);
  const windowStart = new Date(anomalyTimestamp.getTime() - windowBeforeMinutes * 60 * 1000);
  const windowEnd = new Date(anomalyTimestamp.getTime() + windowAfterMinutes * 60 * 1000);

  const allLogs: EvidenceLog[] = [];
  const rationale: EvidenceRationale[] = [];

  // ── Step 1: Trace-correlated logs ─────────────────────────────────────────
  if (traceId) {
    const traceLogs = await _fetchByTraceId(projectId, traceId);
    for (const log of traceLogs) {
      allLogs.push(log);
      rationale.push({
        logId: log.id,
        reason: `Shares traceId=${traceId} with the anomaly event`,
      });
    }
  }

  // ── Step 2: Error/fatal logs in time window ───────────────────────────────
  const errorLogs = await _fetchByTimeAndLevel(
    projectId,
    windowStart,
    windowEnd,
    ['error', 'fatal'],
    service,
    cap * 2 // Fetch more than cap; dedup will reduce
  );

  for (const log of errorLogs) {
    if (!allLogs.find(l => l.id === log.id)) {
      allLogs.push(log);
      rationale.push({
        logId: log.id,
        reason: `Error-level log in the ${windowBeforeMinutes}m window before anomaly`,
      });
    }
  }

  // ── Step 3: Warn logs in window (if capacity remains) ────────────────────
  if (allLogs.length < cap) {
    const warnLogs = await _fetchByTimeAndLevel(
      projectId,
      windowStart,
      windowEnd,
      ['warn'],
      service,
      cap - allLogs.length
    );

    for (const log of warnLogs) {
      if (!allLogs.find(l => l.id === log.id)) {
        allLogs.push(log);
        rationale.push({
          logId: log.id,
          reason: `Warning-level log in the ${windowBeforeMinutes}m window before anomaly`,
        });
      }
    }
  }

  // ── Deduplication by fingerprint ──────────────────────────────────────────
  const seen = new Set<string>();
  const deduplicated: EvidenceLog[] = [];
  const deduplicatedRationale: EvidenceRationale[] = [];

  for (let i = 0; i < allLogs.length; i++) {
    const log = allLogs[i];
    const ratItem = rationale[i];
    if (!log || !ratItem) continue;
    const key = log.fingerprint ?? log.id;
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(log);
      deduplicatedRationale.push(ratItem);
    }
  }

  // ── Sort by timestamp, apply hard cap ─────────────────────────────────────
  deduplicated.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const totalFound = deduplicated.length;
  const capped = deduplicated.slice(0, cap);
  const cappedRationale = deduplicatedRationale.slice(0, cap);

  if (totalFound > cap) {
    logger.warn(
      `[EvidenceRetrieval] Found ${totalFound} evidence logs for project ${projectId}, ` +
      `capped at ${cap} to prevent context overflow.`
    );
  }

  return {
    logs: capped,
    rationale: cappedRationale,
    totalFound,
    cappedAt: cap,
  };
}

// ── Internal fetch helpers ────────────────────────────────────────────────────

async function _fetchByTraceId(
  projectId: string,
  traceId: string
): Promise<EvidenceLog[]> {
  if (isElasticsearchAvailable()) {
    try {
      const client = getElasticsearchClient();
      const index = getIndexName(projectId);
      const response = await client.search({
        index,
        size: HARD_CAP,
        query: {
          bool: {
            must: [
              { term: { projectId } },
              { term: { traceId } },
            ],
          },
        },
        sort: [{ timestamp: { order: 'asc' } }],
      });
      return (response.hits.hits as any[]).map(_esHitToEvidence);
    } catch (err: any) {
      logger.warn(`[EvidenceRetrieval] ES traceId fetch failed: ${err.message}`);
    }
  }

  // MongoDB fallback
  const docs = await LogModel.find({ projectId: new Types.ObjectId(projectId), traceId })
    .sort({ timestamp: 1 })
    .limit(HARD_CAP)
    .lean();
  return docs.map(_mongoDocToEvidence);
}

async function _fetchByTimeAndLevel(
  projectId: string,
  windowStart: Date,
  windowEnd: Date,
  levels: string[],
  service: string | undefined,
  limit: number
): Promise<EvidenceLog[]> {
  if (isElasticsearchAvailable()) {
    try {
      const client = getElasticsearchClient();
      const index = getIndexName(projectId);

      const filter: any[] = [
        { terms: { normalizedLevel: levels } },
        { range: { timestamp: { gte: windowStart.toISOString(), lte: windowEnd.toISOString() } } },
      ];
      if (service) filter.push({ term: { service } });

      const response = await client.search({
        index,
        size: limit,
        query: {
          bool: {
            must: [{ term: { projectId } }],
            filter,
          },
        },
        sort: [{ timestamp: { order: 'desc' } }],
      });
      return (response.hits.hits as any[]).map(_esHitToEvidence);
    } catch (err: any) {
      logger.warn(`[EvidenceRetrieval] ES time/level fetch failed: ${err.message}`);
    }
  }

  // MongoDB fallback
  const query: any = {
    projectId: new Types.ObjectId(projectId),
    normalizedLevel: { $in: levels },
    timestamp: { $gte: windowStart, $lte: windowEnd },
  };
  if (service) query.service = service;

  const docs = await LogModel.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
  return docs.map(_mongoDocToEvidence);
}

// ── Shape converters ──────────────────────────────────────────────────────────

function _esHitToEvidence(hit: any): EvidenceLog {
  const s = hit._source;
  return {
    id: hit._id,
    level: s.level,
    message: s.message,
    service: s.service,
    timestamp: s.timestamp,
    ...(s.traceId ? { traceId: s.traceId } : {}),
    ...(s.requestId ? { requestId: s.requestId } : {}),
    ...(s.environment ? { environment: s.environment } : {}),
    ...(s.errorCategory ? { errorCategory: s.errorCategory } : {}),
    ...(s.fingerprint ? { fingerprint: s.fingerprint } : {}),
    ...(s.metadata ? { metadata: s.metadata } : {}),
  };
}

function _mongoDocToEvidence(doc: any): EvidenceLog {
  return {
    id: doc._id.toString(),
    level: doc.level,
    message: doc.message,
    service: doc.service,
    timestamp: (doc.timestamp as Date).toISOString(),
    ...(doc.traceId ? { traceId: doc.traceId } : {}),
    ...(doc.requestId ? { requestId: doc.requestId } : {}),
    ...(doc.environment ? { environment: doc.environment } : {}),
    ...(doc.errorCategory ? { errorCategory: doc.errorCategory } : {}),
    ...(doc.fingerprint ? { fingerprint: doc.fingerprint } : {}),
    ...(doc.metadata ? { metadata: doc.metadata } : {}),
  };
}
