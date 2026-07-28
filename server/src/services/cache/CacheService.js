import { Redis as UpstashRedis } from '@upstash/redis';
import RedisIo from 'ioredis';
import dotenv from 'dotenv';
import { logger } from '../../utils/logger.util.js';

dotenv.config();

class CacheService {
  constructor() {
    this.client = null;
    this.clientType = null; // 'ioredis' | 'upstash'
    this.isAvailable = false;
    this.init();
  }

  init() {
    const redisUrl = process.env.REDIS_URL;
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (redisUrl) {
      try {
        const client = new RedisIo(redisUrl, {
          lazyConnect: false,
          maxRetriesPerRequest: 1,
          connectTimeout: 5000,
        });
        client.on('error', (err) => {
          logger.warn('Redis', `TCP connection warning: ${err?.message || err}`);
        });
        client.on('ready', () => {
          this.isAvailable = true;
        });
        this.client = client;
        this.clientType = 'ioredis';
        this.isAvailable = true;
      } catch (err) {
        logger.warn('Redis', `Failed to initialize TCP client: ${err?.message}`);
        this.isAvailable = false;
      }
    } else if (upstashUrl && upstashToken && upstashUrl !== 'https://mock-redis.upstash.io') {
      try {
        this.client = new UpstashRedis({ url: upstashUrl, token: upstashToken });
        this.clientType = 'upstash';
        this.isAvailable = true;
      } catch (err) {
        logger.warn('Redis', `Failed to initialize Upstash REST client: ${err?.message}`);
        this.isAvailable = false;
      }
    } else {
      this.isAvailable = false;
    }
  }

  async get(key) {
    if (!this.isAvailable || !this.client) return null;

    try {
      const data = await this.client.get(key);
      if (!data) return null;
      logger.info('Cache', `HIT for key: "${key}"`);
      return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (err) {
      logger.warn('Redis', `Read exception for key "${key}" (failing open): ${err?.message || err}`);
      return null;
    }
  }

  async set(key, value, ttlSeconds = 3600) {
    if (!this.isAvailable || !this.client) return false;

    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      if (this.clientType === 'ioredis') {
        await this.client.set(key, serialized, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, serialized, { ex: ttlSeconds });
      }
      logger.info('Cache', `SET key: "${key}" (TTL: ${ttlSeconds}s)`);
      return true;
    } catch (err) {
      logger.warn('Redis', `Write exception for key "${key}" (failing open): ${err?.message || err}`);
      return false;
    }
  }
}

export const cacheService = new CacheService();
export default cacheService;
