/**
 * elasticsearch.ts
 *
 * Responsibility:
 * Elasticsearch client initialization, connection management, and health check.
 *
 * Design decisions:
 * - Client is a singleton initialized once at startup.
 * - If Elasticsearch is unavailable, the application starts in degraded mode
 *   (MongoDB remains the source of truth; search degrades to MongoDB $text).
 * - Credentials and URL come exclusively from environment variables.
 */

import { Client } from '@elastic/elasticsearch';
import { logger } from '../utils/logger';

// ── Configuration ─────────────────────────────────────────────────────────────

export const esConfig = {
  url: process.env.ELASTICSEARCH_URL ?? 'http://localhost:9200',
  username: process.env.ELASTICSEARCH_USERNAME,
  password: process.env.ELASTICSEARCH_PASSWORD,
  apiKey: process.env.ELASTICSEARCH_API_KEY,
  /** TLS: path to CA certificate for self-signed certs (optional) */
  tls: process.env.ELASTICSEARCH_TLS_CA,
  /**
   * Maximum time in milliseconds to wait for a single Elasticsearch request.
   * Prevents cascading failures when ES is slow.
   */
  requestTimeoutMs: Number(process.env.ELASTICSEARCH_REQUEST_TIMEOUT_MS ?? 5000),
  /**
   * Connection timeout — how long to wait for a TCP connection to establish.
   */
  connectTimeoutMs: Number(process.env.ELASTICSEARCH_CONNECT_TIMEOUT_MS ?? 3000),
} as const;

// ── Client instance ────────────────────────────────────────────────────────────

let _client: Client | null = null;
let _available = false;

/**
 * Returns the Elasticsearch client singleton.
 * Initializes it on first call.
 */
export function getElasticsearchClient(): Client {
  if (!_client) {
    const clientOptions: ConstructorParameters<typeof Client>[0] = {
      node: esConfig.url,
      requestTimeout: esConfig.requestTimeoutMs,
    };

    if (esConfig.apiKey) {
      (clientOptions as any).auth = { apiKey: esConfig.apiKey };
    } else if (esConfig.username && esConfig.password) {
      (clientOptions as any).auth = {
        username: esConfig.username,
        password: esConfig.password,
      };
    }

    _client = new Client(clientOptions);
  }
  return _client;
}

/**
 * Returns whether Elasticsearch was successfully contacted at startup.
 * Use this to decide whether to use ES or fall back to MongoDB.
 */
export function isElasticsearchAvailable(): boolean {
  return _available;
}

/**
 * Pings Elasticsearch and marks it as available/unavailable.
 * Called once during application startup.
 * Does not throw — failure is handled gracefully.
 */
export async function connectElasticsearch(): Promise<void> {
  const client = getElasticsearchClient();
  try {
    const ping = await client.ping({}, { requestTimeout: esConfig.connectTimeoutMs });
    _available = true;
    logger.info('✅ Elasticsearch connected successfully.');
  } catch (error: any) {
    _available = false;
    logger.warn(`⚠️  Elasticsearch unavailable: ${error.message}. Search and analytics will fall back to MongoDB.`);
  }
}

/**
 * Closes the Elasticsearch client connection gracefully.
 * Called during application shutdown.
 */
export async function disconnectElasticsearch(): Promise<void> {
  if (_client) {
    try {
      await _client.close();
      logger.info('Elasticsearch client closed.');
    } catch (error: any) {
      logger.error(`Error closing Elasticsearch client: ${error.message}`);
    } finally {
      _client = null;
      _available = false;
    }
  }
}
