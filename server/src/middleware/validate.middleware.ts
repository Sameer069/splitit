import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from '../utils/errors';

/**
 * Generic validation middleware factory
 * Validates req.body, req.params, or req.query against a Zod schema
 */
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.safeParse(req.body);
      
      if (!parsed.success) {
        throw new ValidationError(parsed.error.errors[0].message);
      }
      
      // Replace body with parsed data (ensures type safety and defaults)
      req.body = parsed.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.safeParse(req.params);
      
      if (!parsed.success) {
        throw new ValidationError(parsed.error.errors[0].message);
      }
      
      req.params = parsed.data as Record<string, string>;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.safeParse(req.query);
      
      if (!parsed.success) {
        throw new ValidationError(parsed.error.errors[0].message);
      }
      
      req.query = parsed.data as Record<string, string>;
      next();
    } catch (error) {
      next(error);
    }
  };
};
