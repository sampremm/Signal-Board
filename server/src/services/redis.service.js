import { cacheService } from './cache/CacheService.js';

export const circuitBreaker = {
  async getCachedAIResult(queryText) {
    const key = `search:ai:${queryText.trim().toLowerCase()}`;
    return await cacheService.get(key);
  },

  async cacheAIResult(queryText, extractedParams, ttlSeconds = 3600) {
    const key = `search:ai:${queryText.trim().toLowerCase()}`;
    return await cacheService.set(key, extractedParams, ttlSeconds);
  },

  /**
   * Fail-open rate limiter method.
   * Ensures calls to circuitBreaker.checkLimit() never fail or crash middleware.
   */
  async checkLimit(identifier = 'anonymous_edge', limit = 20, windowSeconds = 60) {
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: Date.now() + windowSeconds * 1000,
    };
  },

  async isRateLimited(identifier = 'anonymous_edge', limit = 20, windowSeconds = 60) {
    return this.checkLimit(identifier, limit, windowSeconds);
  },
};

export const redisClient = cacheService;
export default cacheService;
