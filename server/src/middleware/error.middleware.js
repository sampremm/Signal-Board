import { logger } from '../utils/logger.util.js';

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || 500;
  
  // Log the error centrally
  if (statusCode >= 500) {
    logger.error('System', 'Unhandled server exception', err);
  } else {
    logger.warn('System', `Client error: ${err.message}`, { status: statusCode });
  }

  res.status(statusCode).json({
    success: false,
    error: err.message || 'An internal system error occurred.',
    code: err.code || 'INTERNAL_ERROR',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};
