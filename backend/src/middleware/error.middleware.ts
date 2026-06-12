import mongoose from 'mongoose';
import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

export const errorMiddleware = (
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errorCode = 'INTERNAL_SERVER_ERROR';

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    errorCode = error.errorCode ?? (statusCode >= 500 ? 'SERVER_ERROR' : 'CLIENT_ERROR');
  } else if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = Object.values(error.errors)
      .map((validationError) => validationError.message)
      .join('; ');
  } else if (error instanceof mongoose.Error.CastError) {
    statusCode = 400;
    errorCode = 'INVALID_ID';
    message = `Invalid ${error.path}`;
  } else if (typeof error === 'object' && error !== null && 'code' in error && (error as Record<string, unknown>).code === 11000) {
    statusCode = 409;
    errorCode = 'DUPLICATE_KEY';
    message = 'Duplicate field value entered';
  } else if (error instanceof Error) {
    message = error.message;
  }

  logger.error(`${req.method} ${req.originalUrl} ${statusCode} - ${message}`);

  res.setHeader('Content-Type', 'application/json');
  res.status(statusCode).json({
    success: false,
    message,
    errorCode,
  });
};
