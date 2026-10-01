import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { env } from '../utils/env';

/**
 * Centralized error handling middleware
 * Converts errors to consistent JSON response format
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error
  logger.error({
    err,
    method: req.method,
    path: req.path,
    userId: req.user?.id,
  }, 'Request error');

  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      message: err.errors[0].message,
      details: err.errors,
    });
    return;
  }

  // Custom AppError instances
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.name,
      message: err.message,
    });
    return;
  }

  // Prisma errors
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as unknown as { code: string; meta?: Record<string, unknown> };
    
    // Unique constraint violation
    if (prismaError.code === 'P2002') {
      res.status(409).json({
        error: 'Conflict',
        message: 'A record with this value already exists',
      });
      return;
    }

    // Foreign key constraint violation
    if (prismaError.code === 'P2003') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Referenced record does not exist',
      });
      return;
    }

    // Record not found
    if (prismaError.code === 'P2025') {
      res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found',
      });
      return;
    }
  }

  // JWT errors (shouldn't reach here if caught properly, but just in case)
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
    return;
  }

  // Default server error
  // Don't leak error details in production
  res.status(500).json({
    error: 'Internal Server Error',
    message: env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
  });
};
