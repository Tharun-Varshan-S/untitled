import { validateLogPayload, validateBulkLogPayload } from './logs.validation';
import { AppError } from '../utils/AppError';

describe('Log Validation', () => {
  describe('validateLogPayload', () => {
    it('should pass with valid info log', () => {
      const payload = {
        level: 'info',
        message: 'System started',
        service: 'auth-service',
      };
      const result = validateLogPayload(payload);
      expect(result).toEqual(payload);
    });

    it('should pass with valid fatal log', () => {
      const payload = {
        level: 'fatal',
        message: 'Database corrupted',
        service: 'db-service',
      };
      const result = validateLogPayload(payload);
      expect(result).toEqual(payload);
    });

    it('should throw AppError if level is missing', () => {
      const payload = {
        message: 'msg',
        service: 'svc',
      };
      expect(() => validateLogPayload(payload)).toThrow(AppError);
      expect(() => validateLogPayload(payload)).toThrow('Log level is required');
    });

    it('should throw AppError if level is invalid', () => {
      const payload = {
        level: 'unknown',
        message: 'msg',
        service: 'svc',
      };
      expect(() => validateLogPayload(payload)).toThrow(AppError);
      expect(() => validateLogPayload(payload)).toThrow('Invalid log level');
    });

    it('should pass with valid timestamp', () => {
      const payload = {
        level: 'warn',
        message: 'msg',
        service: 'svc',
        timestamp: new Date().toISOString(),
      };
      expect(() => validateLogPayload(payload)).not.toThrow();
    });
  });

  describe('validateBulkLogPayload', () => {
    it('should pass with array of valid logs', () => {
      const payload = [
        { level: 'info', message: 'm1', service: 's1' },
        { level: 'fatal', message: 'm2', service: 's1' },
      ];
      const result = validateBulkLogPayload(payload);
      expect(result).toHaveLength(2);
    });

    it('should throw if not an array', () => {
      expect(() => validateBulkLogPayload({})).toThrow('Bulk payload must be an array');
    });

    it('should throw if array is empty', () => {
      expect(() => validateBulkLogPayload([])).toThrow('Bulk payload must contain at least one log entry');
    });

    it('should throw with item index if one log is invalid', () => {
      const payload = [
        { level: 'info', message: 'm1', service: 's1' },
        { level: 'invalid', message: 'm2', service: 's1' },
      ];
      expect(() => validateBulkLogPayload(payload)).toThrow('Item 1: Invalid log level');
    });
  });
});
