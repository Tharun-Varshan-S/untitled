import api from '../lib/api';
import { SearchParams, SearchResponse } from '../types/search.types';

export const searchApi = {
  searchLogs: async (params: SearchParams): Promise<SearchResponse> => {
    const { projectId, ...queryParams } = params;
    
    // Clean up undefined or empty string params before sending
    const cleanedParams = Object.fromEntries(
      Object.entries(queryParams).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    
    const response = await api.get<SearchResponse>(`/projects/${projectId}/search`, {
      params: cleanedParams
    });
    
    return response.data;
  },
};
