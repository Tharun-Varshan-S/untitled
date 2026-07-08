import LogModel from '../../../models/Log';
import { SearchFilters } from '../../../types/search.types';
import { SearchConfig } from '../../../config/search.config';

export class SearchExecutor {
  async execute(filters: SearchFilters, limit: number, isTextSearch: boolean): Promise<any[]> {
    const projection = {
      _id: 1,
      level: 1,
      message: 1,
      service: 1,
      metadata: 1,
      timestamp: 1,
      ...(isTextSearch ? { score: { $meta: 'textScore' } } : {}),
    };

    const sort = SearchConfig.database.defaultSort;

    // Execute query with maxTimeMS to prevent DoS attacks on complex text queries
    return LogModel.find(filters as any, projection)
      .sort(sort as any)
      .limit(limit + 1)
      .maxTimeMS(SearchConfig.database.maxTimeMS)
      .lean()
      .exec();
  }
}
