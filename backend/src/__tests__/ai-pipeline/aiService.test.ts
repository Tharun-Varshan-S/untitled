/**
 * aiService.test.ts
 *
 * Tests for aiService, which delegates AI inference to the loglens-ai
 * Python microservice via axios HTTP. The Groq SDK is NOT used directly
 * in the Node.js backend — it lives in the Python service.
 *
 * Tests verify:
 * 1. analyzeLog calls the correct endpoint with the correct payload/headers
 * 2. Response is serialized as JSON string
 * 3. Errors are propagated correctly
 * 4. Timeout is respected
 */

import axios from 'axios';
import { aiService } from '../../services/aiService';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const WORKSPACE_ID = 'ws-123';
const PROJECT_ID = 'proj-456';
const LOG_STRING = '[ERROR] Database connection failed after 3 retries';

describe('AI Service (HTTP proxy to loglens-ai)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeLog', () => {
    it('1. should POST to the /analyze endpoint on the AI service URL', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true, summary: 'DB outage', rootCause: 'Connection timeout' },
      });

      await aiService.analyzeLog(WORKSPACE_ID, PROJECT_ID, LOG_STRING);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/analyze'),
        expect.objectContaining({
          workspaceId: WORKSPACE_ID,
          projectId: PROJECT_ID,
          logs: [LOG_STRING],
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('2. should include the X-Service-Key header for internal auth', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true, summary: 'ok' },
      });

      await aiService.analyzeLog(WORKSPACE_ID, PROJECT_ID, LOG_STRING);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Service-Key': expect.any(String),
          }),
        })
      );
    });

    it('3. should return the response body serialized as a JSON string', async () => {
      const responseData = { success: true, summary: 'Memory leak detected', rootCause: 'Unclosed stream' };
      mockedAxios.post.mockResolvedValueOnce({ data: responseData });

      const result = await aiService.analyzeLog(WORKSPACE_ID, PROJECT_ID, LOG_STRING);

      expect(result).toBe(JSON.stringify(responseData));
    });

    it('4. should set a 30-second timeout on the request', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: {} });

      await aiService.analyzeLog(WORKSPACE_ID, PROJECT_ID, LOG_STRING);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({ timeout: 30000 })
      );
    });

    it('5. should propagate axios errors (network failure, 5xx)', async () => {
      const networkError = new Error('connect ECONNREFUSED 127.0.0.1:8000');
      mockedAxios.post.mockRejectedValueOnce(networkError);

      await expect(aiService.analyzeLog(WORKSPACE_ID, PROJECT_ID, LOG_STRING))
        .rejects.toThrow('connect ECONNREFUSED');
    });

    it('6. should send log as an array (API contract)', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: {} });

      await aiService.analyzeLog(WORKSPACE_ID, PROJECT_ID, LOG_STRING);

      const callArgs = mockedAxios.post.mock.calls[0];
      const body = callArgs?.[1] as { logs: unknown };
      expect(Array.isArray(body?.logs)).toBe(true);
      expect(body?.logs).toHaveLength(1);
    });

    it('7. should work with empty log string', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

      const result = await aiService.analyzeLog(WORKSPACE_ID, PROJECT_ID, '');

      expect(typeof result).toBe('string');
    });

    it('8. should handle AI service returning success:false without throwing', async () => {
      const failureResponse = { success: false, error: 'Model rate limited' };
      mockedAxios.post.mockResolvedValueOnce({ data: failureResponse });

      const result = await aiService.analyzeLog(WORKSPACE_ID, PROJECT_ID, LOG_STRING);

      // The Node.js service delegates error handling to the caller
      expect(result).toBe(JSON.stringify(failureResponse));
    });
  });
});
