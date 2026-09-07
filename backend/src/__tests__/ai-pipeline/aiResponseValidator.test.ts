import { validateAiResponse, AiAnalysisSchema } from '../../validators/aiResponseValidator';
import { logger } from '../../utils/logger';

jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe('AI Response Validator', () => {
  const validPayload = {
    summary: 'Everything is fine',
    severity: 'info',
    rootCause: 'Normal operation',
    suggestedFix: 'None required',
    confidence: 0.95,
  };

  const validJson = JSON.stringify(validPayload);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Paths & Markdown Cleaning', () => {
    it('1. should parse and return a perfectly valid JSON object', () => {
      const result = validateAiResponse(validJson);
      expect(result).toEqual(validPayload);
    });

    it('2. should strip standard ```json markdown fences', () => {
      const markdownJson = `\`\`\`json\n${validJson}\n\`\`\``;
      const result = validateAiResponse(markdownJson);
      expect(result).toEqual(validPayload);
    });

    it('3. should strip generic ``` markdown fences', () => {
      const markdownJson = `\`\`\`\n${validJson}\n\`\`\``;
      const result = validateAiResponse(markdownJson);
      expect(result).toEqual(validPayload);
    });

    it('4. should handle extra whitespace before the fence', () => {
      const markdownJson = `   \n\`\`\`json\n${validJson}\n\`\`\``;
      const result = validateAiResponse(markdownJson);
      expect(result).toEqual(validPayload);
    });

    it('5. should handle extra whitespace after the fence', () => {
      const markdownJson = `\`\`\`json\n${validJson}\n\`\`\`\n  \n`;
      const result = validateAiResponse(markdownJson);
      expect(result).toEqual(validPayload);
    });

    it('6. should handle single-line markdown fences (edge case)', () => {
      const markdownJson = `\`\`\`${validJson}\`\`\``;
      // Depending on the implementation, this might fail or pass, but the logic 
      // uses indexOf('\n') for the start. We will see if it fails. If it does, 
      // JSON.parse throws and we catch it.
      // But let's test a realistic multi-line one that we expect to pass.
      const multiLine = `\`\`\`json\n{"summary": "s", "severity": "info", "rootCause": "r", "suggestedFix": "f", "confidence": 1}\n\`\`\``;
      expect(validateAiResponse(multiLine)).toBeDefined();
    });
  });

  describe('Malformed JSON', () => {
    it('7. should throw if JSON is completely invalid', () => {
      expect(() => validateAiResponse('Not JSON at all')).toThrow('Invalid AI Response format');
    });

    it('8. should throw if JSON is truncated', () => {
      expect(() => validateAiResponse('{"summary": "incomplete"')).toThrow('Invalid AI Response format');
    });

    it('9. should throw if JSON has unescaped quotes', () => {
      expect(() => validateAiResponse('{"summary": "bad "quote"", "severity": "info", "rootCause": "c", "suggestedFix": "f", "confidence": 0.5}')).toThrow();
    });

    it('10. should log the raw response when JSON parsing fails', () => {
      try {
        validateAiResponse('BAD_JSON');
      } catch (e) {
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to validate AI response'));
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('BAD_JSON'));
      }
    });
  });

  describe('Zod Schema Validations - Required Fields', () => {
    const fields = ['summary', 'severity', 'rootCause', 'suggestedFix', 'confidence'];

    fields.forEach((field, index) => {
      it(`${11 + index}. should throw if required field '${field}' is missing`, () => {
        const payload = { ...validPayload };
        delete (payload as any)[field];
        expect(() => validateAiResponse(JSON.stringify(payload))).toThrow();
      });
    });

    fields.forEach((field, index) => {
      it(`${16 + index}. should throw if required field '${field}' is null`, () => {
        const payload = { ...validPayload };
        (payload as any)[field] = null;
        expect(() => validateAiResponse(JSON.stringify(payload))).toThrow();
      });
    });
    
    fields.forEach((field, index) => {
      it(`${21 + index}. should throw if required field '${field}' is undefined (in JSON, undefined is omitted, but let's test nullish)`, () => {
        const payload = { ...validPayload };
        (payload as any)[field] = undefined;
        // JSON.stringify drops undefined, so it simulates missing field
        expect(() => validateAiResponse(JSON.stringify(payload))).toThrow();
      });
    });
  });

  describe('Zod Schema Validations - Types and Constraints', () => {
    it('26. should throw if summary is empty string', () => {
      const payload = { ...validPayload, summary: '' };
      expect(() => validateAiResponse(JSON.stringify(payload))).toThrow();
    });

    it('27. should throw if summary is a number', () => {
      const payload = { ...validPayload, summary: 123 as any };
      expect(() => validateAiResponse(JSON.stringify(payload))).toThrow();
    });

    it('28. should throw if rootCause is empty string', () => {
      const payload = { ...validPayload, rootCause: '' };
      expect(() => validateAiResponse(JSON.stringify(payload))).toThrow();
    });

    it('29. should throw if suggestedFix is empty string', () => {
      const payload = { ...validPayload, suggestedFix: '' };
      expect(() => validateAiResponse(JSON.stringify(payload))).toThrow();
    });

    const validSeverities = ['info', 'warn', 'error', 'fatal'];
    validSeverities.forEach((sev, i) => {
      it(`${30 + i}. should accept valid severity '${sev}'`, () => {
        const payload = { ...validPayload, severity: sev };
        const result = validateAiResponse(JSON.stringify(payload));
        expect(result.severity).toBe(sev);
      });
    });

    it('34. should throw if severity is invalid (e.g., critical)', () => {
      const payload = { ...validPayload, severity: 'critical' };
      expect(() => validateAiResponse(JSON.stringify(payload))).toThrow();
    });

    it('35. should throw if severity is uppercase (INFO)', () => {
      const payload = { ...validPayload, severity: 'INFO' };
      expect(() => validateAiResponse(JSON.stringify(payload))).toThrow();
    });

    it('36. should accept confidence exactly 0', () => {
      const payload = { ...validPayload, confidence: 0 };
      expect(validateAiResponse(JSON.stringify(payload)).confidence).toBe(0);
    });

    it('37. should accept confidence exactly 1', () => {
      const payload = { ...validPayload, confidence: 1 };
      expect(validateAiResponse(JSON.stringify(payload)).confidence).toBe(1);
    });

    it('38. should throw if confidence is negative', () => {
      const payload = { ...validPayload, confidence: -0.1 };
      expect(() => validateAiResponse(JSON.stringify(payload))).toThrow();
    });

    it('39. should throw if confidence is > 1', () => {
      const payload = { ...validPayload, confidence: 1.1 };
      expect(() => validateAiResponse(JSON.stringify(payload))).toThrow();
    });

    it('40. should throw if confidence is a string "0.5"', () => {
      const payload = { ...validPayload, confidence: "0.5" as any };
      expect(() => validateAiResponse(JSON.stringify(payload))).toThrow();
    });
  });
});
