import { API_BASE_URL, AUTH_TOKEN_KEY } from '../lib/constants';

export interface UploadResult {
  totalProcessed: number;
  totalInserted: number;
  totalRejected: number;
  rejectionReasons: Array<{ index: number; reason: string }>;
  message: string;
}

export const uploadApi = {
  uploadFile: async (file: File, projectId: string): Promise<UploadResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);

    const token = typeof window !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null;

    const response = await fetch(`${API_BASE_URL}/logs/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.message || 'Upload failed');
    }

    return json.data as UploadResult;
  },
};
