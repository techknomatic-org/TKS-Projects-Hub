import { ZodError } from 'zod';
import pkg from '@prisma/client';
const { Prisma } = pkg;
import logger from '../lib/logger.js';

export const errorMiddleware = (err, req, res, next) => {
  logger.error(`${req.method} ${req.originalUrl} - Error: ${err.message || err}`);
  if (err.stack) {
    logger.error(err.stack);
  }

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: (err.issues || err.errors || []).map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    });
  }

  // Handle Prisma Known Request Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint failed
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: `Unique constraint failed on field: ${err.meta?.target || 'unknown'}`
      });
    }
    // Record not found
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: err.meta?.cause || 'Record not found in database.'
      });
    }
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token.'
    });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Authorization token has expired.'
    });
  }

  // Default response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    success: false,
    message: message
  });
};

export default errorMiddleware;
