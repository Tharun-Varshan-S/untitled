import { fetchApi } from '../lib/api';
import { ApiKey, CreateApiKeyPayload } from '../types/api-key.types';
import { ApiSuccess } from '../types/auth.types';

export const apiKeyApi = {
  getApiKeys: async (projectId: string): Promise<ApiKey[]> => {
    const res = await fetchApi<ApiSuccess<ApiKey[]>>(`/projects/${projectId}/api-keys`);
    return res.data;
  },

  createApiKey: async (projectId: string, payload: CreateApiKeyPayload): Promise<ApiKey> => {
    const res = await fetchApi<ApiSuccess<ApiKey>>(`/projects/${projectId}/api-keys`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },
};
