import { circuitBreaker } from '../services/redis.service.js';
import { logger } from '../utils/logger.util.js';

/**
 * Rate-Limiting & Circuit-Breaking Middleware
 * Operates in fail-open mode if Redis is unavailable or unconfigured.
 */
export const rateLimitMiddleware = async (req, res, next) => {
  try {
    const identifier = req.user?.id || req.ip || req.headers['x-forwarded-for'] || 'anonymous_edge';
    
    // Call checkLimit safely on circuitBreaker
    const limitResult = await circuitBreaker.checkLimit(identifier.toString());
    
    if (limitResult && typeof limitResult.limit === 'number') {
      res.setHeader('X-RateLimit-Limit', limitResult.limit.toString());
      res.setHeader('X-RateLimit-Remaining', (limitResult.remaining ?? limitResult.limit - 1).toString());

      if (limitResult.success === false) {
        logger.warn('RateLimit', `Rate limit exceeded for identifier: ${identifier}`);
        res.status(429).json({
          success: false,
          error: 'Too Many Requests: rate limit exceeded. Please wait before retrying.',
          limit: limitResult.limit,
          remaining: limitResult.remaining,
        });
        return;
      }
    }

    next();
  } catch (error) {
    // Fail-open strategy: log warning and proceed
    logger.warn('RateLimit', `Limiter evaluation exception (failing open): ${error?.message || error}`);
    next();
  }
};

export default rateLimitMiddleware;
