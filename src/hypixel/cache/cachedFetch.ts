import { redis } from "../../services/redisClient";
import { logger } from "../../utils/logger";

const inFlight = new Map<string, Promise<unknown>>();

/**
 * Reads `key` from Redis; on miss, calls `fetcher` and writes the result with the given TTL.
 * Concurrent calls for the same key while a fetch is in-flight share the same promise
 * instead of issuing duplicate upstream requests (request deduplication).
 */
export async function getOrSetCache<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
  try {
    const cached = await redis.get(key);
    if (cached !== null) {
      return JSON.parse(cached) as T;
    }
  } catch (err) {
    logger.warn({ err, key }, "Cache read failed, falling back to upstream fetch");
  }

  const existing = inFlight.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = (async () => {
    try {
      const result = await fetcher();
      try {
        await redis.set(key, JSON.stringify(result), "EX", ttlSeconds);
      } catch (err) {
        logger.warn({ err, key }, "Cache write failed");
      }
      return result;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}

export async function invalidateCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (err) {
    logger.warn({ err, key }, "Cache invalidation failed");
  }
}
