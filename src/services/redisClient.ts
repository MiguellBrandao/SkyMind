import Redis from "ioredis";
import { env } from "../config/env";
import { logger } from "../utils/logger";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  // Connects on first command rather than at process startup, so simply importing this
  // module (as most of the codebase transitively does) never opens a socket by itself -
  // this matters for unit tests that never touch the cache.
  lazyConnect: true,
});

redis.on("error", (err) => {
  logger.error({ err }, "Redis connection error");
});

redis.on("connect", () => {
  logger.info("Connected to Redis");
});

export async function checkRedisHealth(): Promise<boolean> {
  try {
    const pong = await redis.ping();
    return pong === "PONG";
  } catch (err) {
    logger.error({ err }, "Redis health check failed");
    return false;
  }
}

export async function closeRedis(): Promise<void> {
  await redis.quit();
}
