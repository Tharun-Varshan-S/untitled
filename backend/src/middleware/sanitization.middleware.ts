import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

/**
 * Sanitization middleware for common fields
 * - Trims whitespace
 * - Escapes HTML special characters
 * - Validates format where applicable
 */

export const sanitizeProjectInput = [
  body('name')
    .trim()
    .escape()
    .notEmpty().withMessage('Project name is required').bail()
    .isLength({ min: 1, max: 255 }).withMessage('Project name must be between 1 and 255 characters'),
  body('description')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),
  body('email')
    .optional()
    .trim()
    .normalizeEmail()
    .isEmail().withMessage('Invalid email format'),
];

export const sanitizeLogInput = [
  body('message')
    .trim()
    .escape()
    .notEmpty().withMessage('Log message is required'),
  body('level')
    .trim()
    .isIn(['info', 'warn', 'error', 'debug']).withMessage('Invalid log level'),
  body('service')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 255 }).withMessage('Service name must not exceed 255 characters'),
  body('metadata')
    .optional()
    .custom((value) => {
      if (typeof value === 'object' && value !== null) {
        return true;
      }
      throw new Error('Metadata must be an object');
    }),
];

export const sanitizeApiKeyInput = [
  body('name')
    .trim()
    .escape()
    .notEmpty().withMessage('API key name is required').bail()
    .isLength({ min: 1, max: 255 }).withMessage('API key name must be between 1 and 255 characters'),
  body('expiresAt')
    .optional()
    .isISO8601().withMessage('expiresAt must be a valid ISO 8601 date'),
];

/**
 * Middleware to check validation results and return errors
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorArray = errors.array();
    const firstError = errorArray[0];
    if (firstError) {
      const errorMsg = (firstError as Record<string, unknown>).msg || 'Validation error';
      return next(
        new AppError(
          String(errorMsg),
          400,
          'VALIDATION_ERROR',
        ),
      );
    }
    return next(new AppError('Validation error', 400, 'VALIDATION_ERROR'));
  }
  next();
};
