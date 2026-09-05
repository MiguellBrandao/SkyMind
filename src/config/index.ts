import { env } from "./env";

export { env } from "./env";

export const cacheTtl = {
  player: env.CACHE_TTL_PLAYER,
  profiles: env.CACHE_TTL_PROFILES,
  profile: env.CACHE_TTL_PROFILE,
  bazaar: env.CACHE_TTL_BAZAAR,
  auctions: env.CACHE_TTL_AUCTIONS,
  static: env.CACHE_TTL_STATIC,
} as const;

export const hypixelConfig = {
  apiKey: env.HYPIXEL_API_KEY,
  maxConcurrency: env.HYPIXEL_MAX_CONCURRENCY,
  rateLimitPerMinute: env.HYPIXEL_RATE_LIMIT_PER_MINUTE,
  baseUrl: "https://api.hypixel.net/v2",
} as const;

export const aiConfig = {
  defaultProvider: env.DEFAULT_AI_PROVIDER,
  defaultModel: env.DEFAULT_AI_MODEL,
  defaultApiKey: env.DEFAULT_AI_API_KEY,
  openaiApiKey: env.OPENAI_API_KEY,
  anthropicApiKey: env.ANTHROPIC_API_KEY,
} as const;
