import { unlink } from 'fs/promises';
import { Types } from 'mongoose';
import { AppError } from '../utils/AppError';
import { parseFile } from './parsers';
import { validateLogPayload } from '../validators/logs.validation';
import * as logsRepo from '../repositories/logs.repository';

/**
 * Upload result metadata
 */
export interface UploadResult {
  totalProcessed: number;
  totalInserted: number;
  totalRejected: number;
  rejectionReasons: Array<{ index: number; reason: string }>;
}

/**
 * Upload and process log file
 * 1. Parse file based on type
 * 2. Validate each log entry
 * 3. Bulk insert valid entries
 * 4. Return statistics
 */
export const uploadAndProcessLogs = async (
  projectId: string,
  filePath: string,
  fileName: string
): Promise<UploadResult> => {
  let parsedLogs: Record<string, unknown>[] = [];

  try {
    // Step 1: Parse file
    parsedLogs = parseFile(filePath);

    if (parsedLogs.length === 0) {
      throw new AppError('No logs found in file', 400, 'FILE_NO_LOGS');
    }

    // Step 2: Validate each log entry
    const validLogs = [];
    const rejectionReasons: Array<{ index: number; reason: string }> = [];

    for (let i = 0; i < parsedLogs.length; i++) {
      try {
        const validated = validateLogPayload(parsedLogs[i]);
        validLogs.push(validated);
      } catch (error) {
        rejectionReasons.push({
          index: i,
          reason: error instanceof AppError ? error.message : 'Unknown validation error',
        });
      }
    }

    if (validLogs.length === 0) {
      throw new AppError(
        `All ${parsedLogs.length} log entries failed validation. ${
          rejectionReasons[0] ? `First error: ${rejectionReasons[0].reason}` : ''
        }`,
        400,
        'ALL_LOGS_INVALID'
      );
    }

    // Step 3: Convert to MongoDB documents
    const projectObjectId = new Types.ObjectId(projectId);
    const documents = validLogs.map((log) => ({
      projectId: projectObjectId,
      level: log.level,
      message: log.message,
      service: log.service,
      metadata: log.metadata ?? undefined,
      timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
    }));

    // Step 4: Bulk insert
    let inserted: any[] = [];
    try {
      inserted = await logsRepo.insertLogs(documents);
    } catch (error) {
      throw new AppError(
        `Database insertion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        'DB_INSERT_FAILED'
      );
    }

    // Step 5: Return statistics
    return {
      totalProcessed: parsedLogs.length,
      totalInserted: inserted.length,
      totalRejected: rejectionReasons.length,
      rejectionReasons: rejectionReasons.slice(0, 10), // Return first 10 rejection reasons
    };
  } catch (error) {
    throw error;
  } finally {
    // Always cleanup temporary file
    try {
      await unlink(filePath);
    } catch (cleanupError) {
      // Log but don't throw
      // eslint-disable-next-line no-console
      console.error(`Failed to clean up temporary file ${filePath}:`, cleanupError);
    }
  }
};
