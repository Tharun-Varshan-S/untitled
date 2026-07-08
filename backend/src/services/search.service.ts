import { SearchQuery, PaginatedSearchResponse } from '../types/search.types';
import { SearchPipeline } from '../modules/search/pipeline/SearchPipeline';

const pipeline = new SearchPipeline();

export const performSearch = async (projectId: string, query: SearchQuery): Promise<PaginatedSearchResponse> => {
  return pipeline.execute(projectId, query);
};

