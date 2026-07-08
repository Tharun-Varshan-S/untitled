import { Types } from 'mongoose';
import { SearchQuery, SearchFilters } from '../../../types/search.types';

export class FilterBuilder {
  build(projectId: string, query: SearchQuery): { filters: SearchFilters; isTextSearch: boolean } {
    const filters: SearchFilters = { projectId: new Types.ObjectId(projectId) };

    if (query.level) filters.level = query.level;
    if (query.service) filters.service = query.service;
    if (query.environment) filters['metadata.environment'] = query.environment;
    if (query.source) filters['metadata.source'] = query.source;

    if (query.startDate || query.endDate) {
      filters.timestamp = {};
      if (query.startDate) filters.timestamp.$gte = new Date(query.startDate);
      if (query.endDate) filters.timestamp.$lte = new Date(query.endDate);
    }

    if (query.cursor) {
      const decoded = Buffer.from(query.cursor, 'base64').toString('utf-8');
      const { timestamp, _id } = JSON.parse(decoded);
      const cursorDate = new Date(timestamp);

      filters.$or = [
        { timestamp: { $lt: cursorDate } },
        { timestamp: cursorDate, _id: { $gt: new Types.ObjectId(_id) } },
      ];
    }

    let isTextSearch = false;
    if (query.q) {
      // In future: parse advanced tokens here
      filters.$text = { $search: query.q };
      isTextSearch = true;
    }

    return { filters, isTextSearch };
  }
}
