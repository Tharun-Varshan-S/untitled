import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { AppError } from '../utils/AppError';

/**
 * Sanitization middleware using express-validator
 * Trims and escapes user input to prevent XSS and NoSQL injection attacks
 */

export const sanitizeProjectInput = [
  body('name').trim().escape().notEmpty().withMessage('Project name is required'),
  body('description').optional().trim().escape(),
];

export const sanitizeLogMessage = [
  body('message').trim().escape().notEmpty().withMessage('Log message is required'),
  body('service').optional().trim().escape(),
  body('level').isIn(['info', 'warn', 'error', 'debug']).withMessage('Invalid log level'),
];

export const sanitizeApiKeyInput = [
  body('name').trim().escape().notEmpty().withMessage('API key name is required'),
];

/**
 * Middleware to handle validation errors from express-validator
 */
export function handleSanitizationErrors(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorArray = errors.array();
    const firstError = errorArray[0];
    if (firstError) {
      const errorMsg = (firstError as Record<string, unknown>).msg || 'Validation error';
      throw new AppError(String(errorMsg), 400, 'VALIDATION_ERROR');
    }
    throw new AppError('Validation error', 400, 'VALIDATION_ERROR');
  }
  next();
}
