import { fetchApi } from '../lib/api';
import { SearchParams, SearchResponse } from '../types/search.types';
import { ApiSuccess } from '../types/auth.types';

export const searchApi = {
  searchLogs: async (params: SearchParams): Promise<SearchResponse> => {
    const { projectId, ...queryParams } = params;
    
    // Clean up undefined or empty string params before sending
    const cleanedParams = Object.fromEntries(
      Object.entries(queryParams)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .filter(([_, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => [k, String(v)])
    );
    
    const queryString = new URLSearchParams(cleanedParams).toString();
    const url = `/projects/${projectId}/search${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetchApi<ApiSuccess<SearchResponse>>(url, {
      method: 'GET'
    });
    
    return response.data;
  },
};
