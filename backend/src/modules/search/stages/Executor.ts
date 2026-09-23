import LogModel from '../../../models/Log';
import { SearchFilters } from '../../../types/search.types';
import { SearchConfig } from '../../../config/search.config';
import { getElasticsearchClient, isElasticsearchAvailable } from '../../../config/elasticsearch';
import { getIndexName } from '../../../services/elasticsearch.service';
import { logger } from '../../../utils/logger';

export class SearchExecutor {
  async execute(
    filters: SearchFilters,
    limit: number,
    isTextSearch: boolean,
    rawQuery?: string
  ): Promise<any[]> {
    // ── Elasticsearch path ──────────────────────────────────────────────────
    if (isElasticsearchAvailable()) {
      try {
        const projectId = (filters.projectId as any).toString();
        const index = getIndexName(projectId);
        const client = getElasticsearchClient();

        const must: any[] = [{ term: { projectId } }];
        const filter: any[] = [];

        if (filters.level) filter.push({ term: { normalizedLevel: filters.level } });
        if (filters.service) filter.push({ term: { service: filters.service } });
        if ((filters as any)['metadata.environment']) filter.push({ term: { environment: (filters as any)['metadata.environment'] } });
        if ((filters as any)['metadata.source']) filter.push({ term: { source: (filters as any)['metadata.source'] } });
        if (filters.timestamp) {
          const rangeFilter: any = { timestamp: {} };
          if ((filters.timestamp as any).$gte) rangeFilter.timestamp.gte = (filters.timestamp as any).$gte;
          if ((filters.timestamp as any).$lte) rangeFilter.timestamp.lte = (filters.timestamp as any).$lte;
          filter.push({ range: rangeFilter });
        }

        if (rawQuery) {
          must.push({
            multi_match: {
              query: rawQuery,
              fields: ['message^3', 'service'],
              type: 'best_fields',
              fuzziness: 'AUTO',
            },
          });
        }

        const response = await client.search({
          index,
          size: limit + 1,
          query: { bool: { must, filter } },
          sort: [{ timestamp: { order: 'desc' } }],
        });

        return (response.hits.hits as any[]).map((h) => ({
          _id: h._id,
          level: h._source.level,
          message: h._source.message,
          service: h._source.service,
          metadata: h._source.metadata,
          timestamp: new Date(h._source.timestamp),
          normalizedLevel: h._source.normalizedLevel,
          traceId: h._source.traceId,
          requestId: h._source.requestId,
          environment: h._source.environment,
          source: h._source.source,
          _esScore: h._score,
        }));
      } catch (error: any) {
        logger.warn(`SearchExecutor: Elasticsearch query failed, falling back to MongoDB: ${error.message}`);
        // Fall through to MongoDB
      }
    }

    // ── MongoDB fallback path ────────────────────────────────────────────────
    const projection = {
      _id: 1,
      level: 1,
      message: 1,
      service: 1,
      metadata: 1,
      timestamp: 1,
      normalizedLevel: 1,
      traceId: 1,
      requestId: 1,
      environment: 1,
      source: 1,
      ...(isTextSearch ? { score: { $meta: 'textScore' } } : {}),
    };

    const sort = SearchConfig.database.defaultSort;

    return LogModel.find(filters as any, projection)
      .sort(sort as any)
      .limit(limit + 1)
      .maxTimeMS(SearchConfig.database.maxTimeMS)
      .lean()
      .exec();
  }
}

