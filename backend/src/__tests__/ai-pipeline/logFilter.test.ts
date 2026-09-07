import { isAnalysisWorthy } from '../../utils/logFilter';

describe('Log Filter', () => {

  describe('Severity Levels', () => {
    it('1. should accept "error" level', () => {
      expect(isAnalysisWorthy('error', 'Database connection failed')).toBe(true);
    });

    it('2. should accept "fatal" level', () => {
      expect(isAnalysisWorthy('fatal', 'System crash')).toBe(true);
    });

    it('3. should reject "info" level', () => {
      expect(isAnalysisWorthy('info', 'User logged in')).toBe(false);
    });

    it('4. should reject "warn" level', () => {
      expect(isAnalysisWorthy('warn', 'Rate limit approaching')).toBe(false);
    });

    it('5. should reject "debug" level', () => {
      expect(isAnalysisWorthy('debug', 'Variable x is 5')).toBe(false);
    });

    it('6. should reject "trace" level', () => {
      expect(isAnalysisWorthy('trace', 'Entering function Y')).toBe(false);
    });
    
    it('7. should reject unrecognized severity strings', () => {
      expect(isAnalysisWorthy('critical', 'CPU at 99%')).toBe(false);
    });
    
    it('8. should reject empty severity strings', () => {
      expect(isAnalysisWorthy('', 'Message')).toBe(false);
    });
    
    it('9. should reject undefined severity', () => {
      expect(isAnalysisWorthy(undefined as any, 'Message')).toBe(false);
    });
    
    it('10. should reject null severity', () => {
      expect(isAnalysisWorthy(null as any, 'Message')).toBe(false);
    });

    it('11. should enforce exact case match on severity (reject ERROR)', () => {
      // The function does exactly ANALYSIS_WORTHY_LEVELS.includes, which is case-sensitive
      expect(isAnalysisWorthy('ERROR', 'DB offline')).toBe(false);
    });

    it('12. should enforce exact case match on severity (reject Fatal)', () => {
      expect(isAnalysisWorthy('Fatal', 'Core dump')).toBe(false);
    });
  });

  describe('Message Content Exclusion Rules', () => {
    const errorLevel = 'error';
    const fatalLevel = 'fatal';

    it('13. should reject error logs containing "user cancelled" exactly', () => {
      expect(isAnalysisWorthy(errorLevel, 'Action failed: user cancelled the prompt')).toBe(false);
    });

    it('14. should reject error logs containing "USER CANCELLED" (case insensitive)', () => {
      expect(isAnalysisWorthy(errorLevel, 'Action failed: USER CANCELLED')).toBe(false);
    });

    it('15. should reject error logs containing "User Cancelled" (title case)', () => {
      expect(isAnalysisWorthy(errorLevel, 'Status: User Cancelled by client')).toBe(false);
    });

    it('16. should reject fatal logs containing the exclusion phrase', () => {
      expect(isAnalysisWorthy(fatalLevel, 'Payment dropped: user cancelled')).toBe(false);
    });

    it('17. should NOT reject if the message only contains "cancelled"', () => {
      expect(isAnalysisWorthy(errorLevel, 'Task cancelled due to timeout')).toBe(true);
    });

    it('18. should NOT reject if the message only contains "user"', () => {
      expect(isAnalysisWorthy(errorLevel, 'User session expired')).toBe(true);
    });

    it('19. should NOT reject if the phrase is slightly different', () => {
      expect(isAnalysisWorthy(errorLevel, 'user has cancelled')).toBe(true);
    });

    it('20. should handle missing message string gracefully', () => {
      expect(isAnalysisWorthy(errorLevel, undefined)).toBe(true);
    });

    it('21. should handle null message string gracefully', () => {
      expect(isAnalysisWorthy(errorLevel, null as any)).toBe(true);
    });
    
    it('22. should handle empty message string gracefully', () => {
      expect(isAnalysisWorthy(errorLevel, '')).toBe(true);
    });

    it('23. should handle extremely large message strings', () => {
      const hugeMsg = 'user '.repeat(10000);
      expect(isAnalysisWorthy(errorLevel, hugeMsg)).toBe(true);
    });
    
    it('24. should still exclude extremely large message strings if they contain the phrase', () => {
      const hugeMsg = 'user '.repeat(10000) + 'user cancelled';
      expect(isAnalysisWorthy(errorLevel, hugeMsg)).toBe(false);
    });
  });

  describe('Edge Cases & Parameter Combinations', () => {
    it('25. should reject if level is warn even if message implies an error', () => {
      expect(isAnalysisWorthy('warn', 'fatal exception thrown in worker')).toBe(false);
    });

    it('26. should reject if level is info but message contains stack trace', () => {
      expect(isAnalysisWorthy('info', 'Error: oops at index.js:10')).toBe(false);
    });

    it('27. should accept valid error level even if message is completely irrelevant', () => {
      expect(isAnalysisWorthy('error', 'hello world')).toBe(true);
    });

    it('28. should accept valid error level even if message contains non-ascii characters', () => {
      expect(isAnalysisWorthy('error', 'データベース接続エラー')).toBe(true); // Database connection error
    });

    it('29. should accept valid error level with numbers in message', () => {
      expect(isAnalysisWorthy('error', '12345 67890')).toBe(true);
    });

    it('30. should safely handle object passed as message by coercing or throwing appropriately', () => {
      // The function currently calls message.toLowerCase(). If message is an object, 
      // it might crash if not a string. Let's verify standard behavior.
      // In JS, passing {} to message.toLowerCase() will throw TypeError.
      // Assuming typescript protects us, but testing runtime boundary:
      expect(() => isAnalysisWorthy('error', {} as any)).toThrow();
    });
  });

});
