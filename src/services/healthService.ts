import { aiConfig, env } from "../config";
import { checkDatabaseHealth } from "../database/client";
import { rateLimiter } from "../hypixel/client/httpClient";
import { checkRedisHealth } from "./redisClient";

export async function getHealthReport() {
  const [database, redis] = await Promise.all([checkDatabaseHealth(), checkRedisHealth()]);

  return {
    database,
    redis,
    hypixel: rateLimiter.stats,
    knowledge: {
      wikiSources: 2, // SkyBlock Wiki + Fandom, always active
      redditConfigured: Boolean(env.REDDIT_CLIENT_ID && env.REDDIT_CLIENT_SECRET),
    },
    ai: {
      defaultProvider: aiConfig.defaultProvider,
      defaultModel: aiConfig.defaultModel,
      defaultKeyConfigured: aiConfig.defaultApiKey.length > 0,
    },
  };
}
