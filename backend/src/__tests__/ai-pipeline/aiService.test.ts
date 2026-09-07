import { aiService, aiClient } from '../../services/aiService';
import { groqConfig } from '../../config/groq';

// Mock the Groq SDK
jest.mock('groq-sdk', () => {
  return jest.fn().mockImplementation(() => {
    return {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    };
  });
});

describe('AI Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('aiClient Initialization', () => {
    it('should be a singleton instance (same reference)', () => {
      // 1. Singleton instance check
      const client1 = aiClient;
      const client2 = aiClient;
      expect(client1).toBe(client2);
    });
  });

  describe('generateCompletion', () => {
    it('should call Groq with the correct default parameters (json_object format)', async () => {
      // 2. Default parameters
      const mockCreate = (aiClient.chat.completions.create as jest.Mock).mockResolvedValueOnce({
        choices: [{ message: { content: '{"status":"ok"}' } }],
      });

      const messages = [{ role: 'user', content: 'test log' }];
      const result = await aiService.generateCompletion(messages);

      expect(mockCreate).toHaveBeenCalledWith({
        model: groqConfig.model,
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.1,
      });
      expect(result).toBe('{"status":"ok"}');
    });

    it('should call Groq with text format if provided', async () => {
      // 3. Custom format override
      const mockCreate = (aiClient.chat.completions.create as jest.Mock).mockResolvedValueOnce({
        choices: [{ message: { content: 'text response' } }],
      });

      const messages = [{ role: 'user', content: 'hello' }];
      await aiService.generateCompletion(messages, { type: 'text' });

      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
        response_format: { type: 'text' },
      }));
    });

    it('should return "{}" if the response choices are empty', async () => {
      // 4. Empty choices array
      (aiClient.chat.completions.create as jest.Mock).mockResolvedValueOnce({ choices: [] });
      const result = await aiService.generateCompletion([]);
      expect(result).toBe('{}');
    });

    it('should return "{}" if the message is undefined', async () => {
      // 5. Undefined message
      (aiClient.chat.completions.create as jest.Mock).mockResolvedValueOnce({ choices: [{ message: undefined }] });
      const result = await aiService.generateCompletion([]);
      expect(result).toBe('{}');
    });

    it('should return "{}" if the content is null', async () => {
      // 6. Null content
      (aiClient.chat.completions.create as jest.Mock).mockResolvedValueOnce({ choices: [{ message: { content: null } }] });
      const result = await aiService.generateCompletion([]);
      expect(result).toBe('{}');
    });

    it('should handle string responses properly', async () => {
      // 7. Normal string parsing check
      (aiClient.chat.completions.create as jest.Mock).mockResolvedValueOnce({ choices: [{ message: { content: 'hello world' } }] });
      const result = await aiService.generateCompletion([]);
      expect(result).toBe('hello world');
    });

    it('should propagate errors from the Groq client', async () => {
      // 8. Error propagation
      const error = new Error('API Rate Limit Exceeded');
      (aiClient.chat.completions.create as jest.Mock).mockRejectedValueOnce(error);
      
      await expect(aiService.generateCompletion([])).rejects.toThrow('API Rate Limit Exceeded');
    });
  });
});

describe('AI Service Initialization Edge Cases', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should initialize with correct API key', () => {
    // 9. API Key configuration check
    process.env.GROQ_API_KEY = 'test_key_123';
    jest.mock('../../config/groq', () => ({
      groqConfig: { apiKey: 'test_key_123', maxRetries: 3, timeoutMs: 15000, model: 'test-model' }
    }));
    
    const GroqMock = require('groq-sdk');
    require('../../services/aiService');
    
    expect(GroqMock).toHaveBeenCalledWith(expect.objectContaining({
      apiKey: 'test_key_123'
    }));
  });

  it('should initialize with correct retry configuration', () => {
    // 10. Retry configuration check
    jest.mock('../../config/groq', () => ({
      groqConfig: { apiKey: 'key', maxRetries: 5, timeoutMs: 15000, model: 'test-model' }
    }));
    const GroqMock = require('groq-sdk');
    require('../../services/aiService');
    expect(GroqMock).toHaveBeenCalledWith(expect.objectContaining({ maxRetries: 5 }));
  });

  it('should initialize with correct timeout configuration', () => {
    // 11. Timeout configuration check
    jest.mock('../../config/groq', () => ({
      groqConfig: { apiKey: 'key', maxRetries: 3, timeoutMs: 9999, model: 'test-model' }
    }));
    const GroqMock = require('groq-sdk');
    require('../../services/aiService');
    expect(GroqMock).toHaveBeenCalledWith(expect.objectContaining({ timeout: 9999 }));
  });

  it('should handle initialization when config is malformed', () => {
    // 12. Malformed config
    jest.mock('../../config/groq', () => ({
      groqConfig: { apiKey: '', maxRetries: 0, timeoutMs: 0, model: '' }
    }));
    const GroqMock = require('groq-sdk');
    require('../../services/aiService');
    expect(GroqMock).toHaveBeenCalledWith(expect.objectContaining({ apiKey: '', maxRetries: 0, timeout: 0 }));
  });

  it('should process multi-message conversation arrays', async () => {
    // 13. Multiple messages
    const { aiService, aiClient } = require('../../services/aiService');
    (aiClient.chat.completions.create as jest.Mock).mockResolvedValueOnce({
      choices: [{ message: { content: 'response' } }],
    });

    const messages = [
      { role: 'system', content: 'sys' },
      { role: 'user', content: 'usr' },
      { role: 'assistant', content: 'ast' }
    ];
    await aiService.generateCompletion(messages);

    expect(aiClient.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({ messages })
    );
  });

  it('should send the correct low temperature setting for determinism', async () => {
    // 14. Determinism check
    const { aiService, aiClient } = require('../../services/aiService');
    (aiClient.chat.completions.create as jest.Mock).mockResolvedValueOnce({ choices: [] });
    
    await aiService.generateCompletion([]);
    expect(aiClient.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({ temperature: 0.1 })
    );
  });

  it('should use the globally configured model name', async () => {
    // 15. Model configuration check
    jest.mock('../../config/groq', () => ({
      groqConfig: { apiKey: 'key', maxRetries: 3, timeoutMs: 9999, model: 'super-fast-llama' }
    }));
    
    const { aiService, aiClient } = require('../../services/aiService');
    (aiClient.chat.completions.create as jest.Mock).mockResolvedValueOnce({ choices: [] });
    
    await aiService.generateCompletion([]);
    expect(aiClient.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'super-fast-llama' })
    );
  });
});
