import { fetchApi } from '../lib/api';

export interface UploadStatus {
  id: string;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  uploadedAt: string;
}

class UploadService {
  async uploadFile(file: File, projectId: string): Promise<UploadStatus> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);

    // Can't use fetchApi directly because we need multipart/form-data
    // which shouldn't have Content-Type set manually when using FormData
    const token = typeof window !== 'undefined' ? localStorage.getItem('loglens_auth_token') : null;
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/uploads`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Upload failed');
    }

    return data;
  }

  async getUploadHistory(): Promise<UploadStatus[]> {
    return fetchApi<UploadStatus[]>('/uploads/history');
  }
}

export const uploadService = new UploadService();
