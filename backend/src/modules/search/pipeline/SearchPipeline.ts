import { SearchQuery, PaginatedSearchResponse } from '../../../types/search.types';
import { FilterBuilder } from '../stages/FilterBuilder';
import { SearchExecutor } from '../stages/Executor';
import { ISearchCache, NoOpCache } from '../interfaces/SearchCache';
import { ISearchRateLimiter, NoOpRateLimiter } from '../interfaces/SearchRateLimiter';
import { searchLogger } from '../../../utils/searchLogger';
import { SearchConfig } from '../../../config/search.config';
import { AppError } from '../../../utils/AppError';

export class SearchPipeline {
  private filterBuilder = new FilterBuilder();
  private executor = new SearchExecutor();
  private cache: ISearchCache = new NoOpCache();
  private rateLimiter: ISearchRateLimiter = new NoOpRateLimiter();

  async execute(projectId: string, query: SearchQuery): Promise<PaginatedSearchResponse> {
    const startTime = Date.now();

    // 0. Rate Limiting Check (Future Phase P)
    const allowed = await this.rateLimiter.checkLimit(projectId, SearchConfig.rateLimit.maxRequests, SearchConfig.rateLimit.windowMs);
    if (!allowed) {
      throw new AppError('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED');
    }

    // 1. Cache Check (Future Phase P)
    const cacheKey = `search:${projectId}:${Buffer.from(JSON.stringify(query)).toString('base64')}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      // 2. Build Filters
      const { filters, isTextSearch } = this.filterBuilder.build(projectId, query);

      // 3. Execute Query
      const rawResults = await this.executor.execute(filters, query.limit!, isTextSearch);

      // 4. Paginate Results
      const finalResults = this.paginate(rawResults, query.limit!);

      // 5. Cache Results (Future Phase P)
      await this.cache.set(cacheKey, finalResults, SearchConfig.cache.ttlSeconds);

      // 6. Logging
      searchLogger.logLatency(projectId, query, Date.now() - startTime, finalResults.results.length);

      return finalResults;
    } catch (error: any) {
      searchLogger.logTimeout(projectId, query, error);
      throw new AppError('Search execution failed', 500, 'SEARCH_FAILED');
    }
  }

  private paginate(results: any[], limit: number): PaginatedSearchResponse {
    const hasMore = results.length > limit;
    const paginatedData = hasMore ? results.slice(0, limit) : results;

    let nextCursor: string | null = null;
    if (hasMore && paginatedData.length > 0) {
      const lastItem = paginatedData[paginatedData.length - 1];
      const cursorObj = {
        timestamp: lastItem.timestamp,
        _id: lastItem._id.toString(),
      };
      nextCursor = Buffer.from(JSON.stringify(cursorObj)).toString('base64');
    }

    return {
      results: paginatedData,
      nextCursor,
      hasMore,
      limit,
    };
  }
}

