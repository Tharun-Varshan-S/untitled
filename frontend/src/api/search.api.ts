import { fetchApi } from '../lib/api';
import { SearchParams, SearchResponse } from '../types/search.types';

export const searchApi = {
  searchLogs: async (params: SearchParams): Promise<SearchResponse> => {
    const { projectId, ...queryParams } = params;
    
    // Clean up undefined or empty string params before sending
    const cleanedParams = Object.fromEntries(
      Object.entries(queryParams)
        .filter(([_, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => [k, String(v)])
    );
    
    const queryString = new URLSearchParams(cleanedParams).toString();
    const url = `/projects/${projectId}/search${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetchApi<SearchResponse>(url, {
      method: 'GET'
    });
    
    return response;
  },
};
