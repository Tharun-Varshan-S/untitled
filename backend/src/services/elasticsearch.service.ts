/**
 * elasticsearch.service.ts
 *
 * Responsibility:
 * All Elasticsearch index management, document indexing, and query operations.
 *
 * Design decisions:
 * - One index per project (prefix: `loglens-logs-{projectId}`)
 * - Explicit mappings for all fields (no dynamic mapping for canonical fields)
 * - MongoDB _id used as ES document ID for idempotent indexing
 * - All public methods handle ES unavailability gracefully
 * - Search returns typed results compatible with existing API contracts
 */

import { getElasticsearchClient, isElasticsearchAvailable } from '../config/elasticsearch';
import { logger } from '../utils/logger';
import { SearchQuery, PaginatedSearchResponse } from '../types/search.types';

// ── Index naming ──────────────────────────────────────────────────────────────

export const ES_INDEX_PREFIX = 'loglens-logs';

/**
 * Returns the Elasticsearch index name for a given project.
 * Uses a consistent naming convention across all operations.
 */
export function getIndexName(projectId: string): string {
  // Sanitize projectId to be ES-index-safe (lowercase, no special chars)
  const safe = projectId.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
  return `${ES_INDEX_PREFIX}-${safe}`;
}

// ── Explicit index mappings ───────────────────────────────────────────────────

const LOG_INDEX_MAPPINGS = {
  dynamic: 'strict' as const, // Reject unmapped fields to prevent mapping explosion
  properties: {
    // Core fields
    projectId:       { type: 'keyword' as const },
    workspaceId:     { type: 'keyword' as const },
    level:           { type: 'keyword' as const },
    normalizedLevel: { type: 'keyword' as const },
    message:         { type: 'text' as const, fields: { keyword: { type: 'keyword' as const, ignore_above: 512 } } },
    service:         { type: 'keyword' as const },
    timestamp:       { type: 'date' as const },
    createdAt:       { type: 'date' as const },

    // Canonical identification
    traceId:   { type: 'keyword' as const },
    spanId:    { type: 'keyword' as const },
    requestId: { type: 'keyword' as const },
    host:      { type: 'keyword' as const },
    environment: { type: 'keyword' as const },
    source:    { type: 'keyword' as const },

    // Enrichment
    fingerprint:   { type: 'keyword' as const },
    errorCategory: { type: 'keyword' as const },

    // Metadata: allow dynamic sub-fields but within a nested object
    metadata: {
      type: 'object' as const,
      dynamic: true as const, // Metadata sub-fields use dynamic mapping
    },
  },
};

const LOG_INDEX_SETTINGS = {
  number_of_shards: 1,    // Single shard for small-medium datasets
  number_of_replicas: 0,  // No replicas in development; set to 1 in production
  refresh_interval: '1s', // Near-real-time search
};

// ── Index management ──────────────────────────────────────────────────────────

const _indexCache = new Set<string>();

/**
 * Ensures the project index exists with proper mappings.
 * Idempotent — safe to call repeatedly.
 * Uses in-memory cache to avoid redundant API calls.
 */
export async function ensureIndex(projectId: string): Promise<void> {
  const index = getIndexName(projectId);
  if (_indexCache.has(index)) return;

  const client = getElasticsearchClient();
  try {
    const exists = await client.indices.exists({ index });
    if (!exists) {
      await client.indices.create({
        index,
        mappings: LOG_INDEX_MAPPINGS,
        settings: LOG_INDEX_SETTINGS,
      });
      logger.info(`Elasticsearch index "${index}" created.`);
    }
    _indexCache.add(index);
  } catch (error: any) {
    // Index already exists from a race condition — safe to ignore
    if (error.meta?.body?.error?.type === 'resource_already_exists_exception') {
      _indexCache.add(index);
      return;
    }
    logger.error(`Failed to ensure Elasticsearch index "${index}": ${error.message}`);
    throw error;
  }
}

// ── Document indexing ─────────────────────────────────────────────────────────

export interface EsLogDocument {
  _mongoId: string;
  projectId: string;
  workspaceId?: string;
  level: string;
  normalizedLevel?: string;
  message: string;
  service: string;
  timestamp: string;      // ISO-8601
  createdAt: string;      // ISO-8601
  traceId?: string;
  spanId?: string;
  requestId?: string;
  host?: string;
  environment?: string;
  source?: string;
  fingerprint?: string;
  errorCategory?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Indexes a canonical log document into Elasticsearch.
 * Uses MongoDB _id as the ES document ID for idempotent retries.
 *
 * Failure behavior:
 * - Logs the error and returns false (does not throw).
 * - The caller must handle false as "ES indexing failed but MongoDB succeeded".
 */
export async function indexLog(doc: EsLogDocument): Promise<boolean> {
  if (!isElasticsearchAvailable()) return false;

  const client = getElasticsearchClient();
  const index = getIndexName(doc.projectId);

  try {
    await ensureIndex(doc.projectId);

    // Use the MongoDB ObjectId as ES document ID for idempotency
    await client.index({
      index,
      id: doc._mongoId,
      document: doc,
    });

    return true;
  } catch (error: any) {
    logger.error(`Elasticsearch indexLog failed for doc ${doc._mongoId}: ${error.message}`);
    return false;
  }
}

// ── Search ────────────────────────────────────────────────────────────────────

export interface EsSearchResult {
  hits: Array<{
    _id: string;
    _score: number | null;
    _source: EsLogDocument;
  }>;
  total: number;
}

/**
 * Executes a full-featured log search query against Elasticsearch.
 * Returns raw ES results for the caller to format.
 */
export async function searchLogs(
  projectId: string,
  query: SearchQuery,
  limit: number,
  from: number
): Promise<EsSearchResult | null> {
  if (!isElasticsearchAvailable()) return null;

  const client = getElasticsearchClient();
  const index = getIndexName(projectId);

  // Build bool query
  const must: any[] = [{ term: { projectId } }];
  const filter: any[] = [];

  if (query.level) {
    filter.push({ term: { normalizedLevel: query.level.toLowerCase() } });
  }
  if (query.service) {
    filter.push({ term: { service: query.service } });
  }
  if (query.environment) {
    filter.push({ term: { environment: query.environment } });
  }
  if (query.source) {
    filter.push({ term: { source: query.source } });
  }
  if ((query as any).traceId) {
    filter.push({ term: { traceId: (query as any).traceId } });
  }
  if ((query as any).requestId) {
    filter.push({ term: { requestId: (query as any).requestId } });
  }

  // Time range
  if (query.startDate || query.endDate) {
    const rangeFilter: any = { timestamp: {} };
    if (query.startDate) rangeFilter.timestamp.gte = query.startDate;
    if (query.endDate) rangeFilter.timestamp.lte = query.endDate;
    filter.push({ range: rangeFilter });
  }

  // Full-text search
  if (query.q) {
    must.push({
      multi_match: {
        query: query.q,
        fields: ['message^3', 'service'],
        type: 'best_fields',
        fuzziness: 'AUTO',
      },
    });
  }

  try {
    const response = await client.search({
      index,
      from,
      size: limit + 1, // Fetch one extra to detect hasNextPage
      query: { bool: { must, filter } },
      sort: [{ timestamp: { order: 'desc' } }],
    });

    const hits = response.hits.hits.map((h: any) => ({
      _id: h._id as string,
      _score: h._score as number | null,
      _source: h._source as EsLogDocument,
    }));

    const total = typeof response.hits.total === 'object'
      ? response.hits.total.value
      : (response.hits.total as number ?? 0);

    return { hits, total };
  } catch (error: any) {
    logger.error(`Elasticsearch searchLogs failed for project ${projectId}: ${error.message}`);
    return null;
  }
}

// ── Analytics aggregations ────────────────────────────────────────────────────

export interface EsAnalyticsResult {
  totalLogs: number;
  levelDistribution: Record<string, number>;
  serviceDistribution: Array<{ service: string; count: number }>;
  timeSeriesVolume: Array<{ date: string; count: number }>;
  errorRate: number;
}

/**
 * Runs aggregation queries for the analytics dashboard.
 * Returns null if Elasticsearch is unavailable (caller uses MongoDB fallback).
 */
export async function aggregateLogs(
  projectId: string,
  timeRangeHours: number = 24
): Promise<EsAnalyticsResult | null> {
  if (!isElasticsearchAvailable()) return null;

  const client = getElasticsearchClient();
  const index = getIndexName(projectId);
  const since = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000).toISOString();

  try {
    const response = await client.search({
      index,
      size: 0, // Only aggregations, no hits
      query: {
        bool: {
          must: [{ term: { projectId } }],
          filter: [{ range: { timestamp: { gte: since } } }],
        },
      },
      aggs: {
        level_distribution: {
          terms: { field: 'normalizedLevel', size: 10 },
        },
        service_distribution: {
          terms: { field: 'service', size: 10, order: { _count: 'desc' } },
        },
        time_series: {
          date_histogram: {
            field: 'timestamp',
            calendar_interval: timeRangeHours <= 1 ? 'minute' : timeRangeHours <= 24 ? 'hour' : 'day',
          },
        },
      },
    });

    const aggs = response.aggregations as any;
    const total = typeof response.hits.total === 'object'
      ? response.hits.total.value
      : (response.hits.total as number ?? 0);

    const levelDist: Record<string, number> = {};
    for (const bucket of (aggs?.level_distribution?.buckets ?? [])) {
      levelDist[bucket.key] = bucket.doc_count;
    }

    const serviceDist = (aggs?.service_distribution?.buckets ?? []).map((b: any) => ({
      service: b.key,
      count: b.doc_count,
    }));

    const timeSeries = (aggs?.time_series?.buckets ?? []).map((b: any) => ({
      date: b.key_as_string,
      count: b.doc_count,
    }));

    const errorCount = levelDist['error'] ?? 0 + (levelDist['fatal'] ?? 0);
    const errorRate = total > 0 ? errorCount / total : 0;

    return {
      totalLogs: total,
      levelDistribution: levelDist,
      serviceDistribution: serviceDist,
      timeSeriesVolume: timeSeries,
      errorRate,
    };
  } catch (error: any) {
    logger.error(`Elasticsearch aggregateLogs failed for project ${projectId}: ${error.message}`);
    return null;
  }
}
