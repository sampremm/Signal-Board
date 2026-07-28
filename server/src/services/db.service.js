import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.util.js';

/**
 * Neon Serverless PostgreSQL auto-suspends after inactivity on free tier.
 * PrismaClient is configured with connection retry logic to handle
 * the "Error { kind: Closed }" wake-up error transparently.
 */
let prismaInstance = null;

function getPrisma() {
  if (!prismaInstance) {
    try {
      const options = { log: [] };
      if (process.env.DATABASE_URL) {
        options.datasources = {
          db: {
            url: process.env.DATABASE_URL,
          },
        };
      }
      prismaInstance = new PrismaClient(options);
    } catch (error) {
      logger.error('Database', `Prisma Initialization Failed: ${error.message}`);
      throw error;
    }
  }
  return prismaInstance;
}

// Proxy pattern: Initialize Prisma lazily only when a query is executed.
// This prevents top-level crashes during Vercel cold starts.
export const db = new Proxy({}, {
  get(target, prop) {
    return getPrisma()[prop];
  }
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = db;
}

/**
 * Wraps any Prisma operation with automatic reconnect for Neon's
 * auto-suspend. On the first "closed" connection error, waits 1 second
 * and retries once before throwing to the route-level try/catch.
 *
 * @param {Function} operation - Async Prisma operation to execute
 * @returns {Promise<any>}
 */
export async function withDbRetry(operation) {
  try {
    return await operation();
  } catch (error) {
    const isConnectionError =
      error?.message?.includes('Closed') ||
      error?.message?.includes('connection') ||
      error?.code === 'P1001' ||   // Can't reach database server
      error?.code === 'P1002' ||   // Database server timed out
      error?.code === 'P2024';     // Timed out fetching new connection

    if (isConnectionError) {
      logger.warn('Database', 'Neon auto-suspend detected. Reconnecting in 1.5s...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      try {
        await db.$connect();
        return await operation();
      } catch (retryError) {
        // Retry failed — throw to route-level catch so fallback activates
        throw retryError;
      }
    }

    throw error;
  }
}
