import { Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { uploadAndProcessLogs } from '../services/upload.service';
import { getProjectById } from '../services/project.service';

/**
 * Extract project ID from request
 * For JWT-authenticated flows the client must supply `projectId` as a
 * multipart/form-data field named `projectId` when uploading the file.
 */
const getProjectIdFromRequest = (req: Request): string => {
  const data = req.body as Record<string, unknown>;
  const projectId = typeof data.projectId === 'string' && data.projectId.trim() ? data.projectId.trim() : '';
  if (!projectId) {
    throw new AppError('projectId is required', 400, 'PROJECT_ID_REQUIRED');
  }
  return projectId;
};

/**
 * Validate file exists
 */
const validateFileExists = (file: Express.Multer.File | undefined): void => {
  if (!file) {
    throw new AppError('No file uploaded', 400, 'FILE_MISSING');
  }
};

/**
 * Upload log file controller
 * POST /api/v1/logs/upload
 * Accepts multipart/form-data with file field
 * Supported formats: CSV, JSON, NDJSON
 */
export const uploadLogsController = async (req: Request, res: Response): Promise<void> => {
  // Ensure authenticated user exists (set by authMiddleware)
  const user = req.user as { id?: string } | undefined;
  if (!user?.id) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  const projectId = getProjectIdFromRequest(req);
  const file = req.file;

  validateFileExists(file);

  if (!file) {
    throw new AppError('File validation failed', 400, 'FILE_VALIDATION_FAILED');
  }

  // Verify project ownership (will throw if not found or not owned by user)
  await getProjectById(user.id, projectId);

  const result = await uploadAndProcessLogs(projectId, file.path, file.originalname);

  res.status(201).json({
    success: true,
    data: {
      totalProcessed: result.totalProcessed,
      totalInserted: result.totalInserted,
      totalRejected: result.totalRejected,
      rejectionReasons: result.rejectionReasons,
      message: `Successfully imported ${result.totalInserted} logs from ${file.originalname}`,
    },
  });
};
