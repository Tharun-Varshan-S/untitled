import axios from 'axios';
import { config } from '../config/env';

/**
 * AI Service encapsulating calls to the internal loglens-ai FastAPI service.
 * Keeps external dependencies and AI providers isolated within the Python microservice.
 */
export const aiService = {
  /**
   * Generates a completion from the loglens-ai service.
   * We use the /chat endpoint since it accepts a question and logs, 
   * but for worker analysis, we use /analyze.
   */
  async analyzeLog(workspaceId: string, projectId: string, logString: string): Promise<string> {
    const response = await axios.post(
      `${config.aiServiceUrl}/analyze`,
      {
        workspaceId,
        projectId,
        logs: [logString],
      },
      {
        headers: {
          'X-Service-Key': config.serviceKey,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30s timeout
      }
    );

    // The FastAPI /analyze endpoint returns a structured JSON (success, summary, rootCause, etc.)
    // We return it as a JSON string so validateAiResponse can parse it without changing the worker logic heavily.
    return JSON.stringify(response.data);
  },
};
