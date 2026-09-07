import LogModel from '../models/Log';
import { AiAnalysisOutput } from '../validators/aiResponseValidator';
import { logger } from '../utils/logger';

/**
 * Persists the validated AI analysis to MongoDB, linking it to the originating log document.
 */
export const analysisStorageService = {
  /**
   * Updates an existing log document with AI analysis results.
   * 
   * @param logId The ID of the log document
   * @param analysis The validated analysis object
   * @param modelUsed The name of the AI model used for tracking
   */
  async saveAnalysis(logId: string, analysis: AiAnalysisOutput, modelUsed: string): Promise<void> {
    try {
      const updated = await LogModel.findByIdAndUpdate(
        logId,
        {
          $set: {
            aiAnalysis: {
              ...analysis,
              modelUsed,
              analyzedAt: new Date(),
            },
          },
        },
        { new: true } // Return the updated document if needed
      );

      if (!updated) {
        throw new Error(`Log document with ID ${logId} not found.`);
      }

      logger.info(`[StorageService] Successfully saved AI analysis for log ${logId}`);
    } catch (error) {
      // We log the error but we might re-throw it so the worker knows it failed
      logger.error(`[StorageService] Failed to save AI analysis for log ${logId}: ${error}`);
      throw error;
    }
  },
};
