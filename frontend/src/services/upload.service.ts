import { API_BASE_URL } from '../lib/constants';
import { AUTH_TOKEN_KEY } from '../lib/constants';

/**
 * Result returned by the backend after a successful upload.
 * Backend endpoint: POST /logs/upload
 * Response: { success: true, data: UploadResult }
 */
export interface UploadResult {
  totalProcessed: number;
  totalInserted: number;
  totalRejected: number;
  rejectionReasons: Array<{ index: number; reason: string }>;
  message: string;
}

/**
 * Upload service — aligned to backend upload API contract.
 *
 * POST /logs/upload  → { success: true, data: UploadResult }
 *   Accepts multipart/form-data with:
 *     - file: the log file
 *     - projectId: the target project (form field, not query param)
 *
 * NOTE: There is NO upload history endpoint in the backend.
 * The uploads page shows history only for the current session
 * (in-component state). Persistent history requires a future backend endpoint.
 */

class UploadService {
  /**
   * Uploads a log file for the given project.
   * Uses raw fetch (not fetchApi) because multipart/form-data must NOT
   * have Content-Type set manually — the browser sets the correct
   * boundary automatically when Content-Type is omitted.
   */
  async uploadFile(file: File, projectId: string): Promise<UploadResult> {
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

    // Unwrap { success: true, data: UploadResult }
    return json.data as UploadResult;
  }
}

export const uploadService = new UploadService();
