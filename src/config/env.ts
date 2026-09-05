import "dotenv/config";
import { z } from "zod";

const AiProviderEnum = z.enum(["gemini", "openai", "anthropic", "custom"]);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),

  // Discord
  DISCORD_BOT_TOKEN: z.string().min(1, "DISCORD_BOT_TOKEN is required"),
  DISCORD_CLIENT_ID: z.string().min(1, "DISCORD_CLIENT_ID is required"),
  DISCORD_CLIENT_SECRET: z.string().optional().default(""),
  DISCORD_DEV_GUILD_ID: z.string().optional().default(""),

  // Hypixel
  HYPIXEL_API_KEY: z.string().min(1, "HYPIXEL_API_KEY is required"),
  HYPIXEL_MAX_CONCURRENCY: z.coerce.number().int().positive().default(4),
  HYPIXEL_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(280),

  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Redis
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),

  // Security
  ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, "ENCRYPTION_KEY must be a 64-character hex string (32 bytes). Generate with: openssl rand -hex 32"),

  // AI
  DEFAULT_AI_PROVIDER: AiProviderEnum.default("gemini"),
  DEFAULT_AI_MODEL: z.string().default("gemini-2.5-flash"),
  DEFAULT_AI_API_KEY: z.string().optional().default(""),
  OPENAI_API_KEY: z.string().optional().default(""),
  ANTHROPIC_API_KEY: z.string().optional().default(""),

  // Optional: enables the Reddit r/HypixelSkyblock source in search_skyblock_knowledge. Without
  // these, that source is silently skipped (wiki search still works). Create a free "script" app
  // at https://www.reddit.com/prefs/apps to get a client ID/secret.
  REDDIT_CLIENT_ID: z.string().optional().default(""),
  REDDIT_CLIENT_SECRET: z.string().optional().default(""),

  // Cache TTLs
  CACHE_TTL_PLAYER: z.coerce.number().int().positive().default(900),
  CACHE_TTL_PROFILES: z.coerce.number().int().positive().default(180),
  CACHE_TTL_PROFILE: z.coerce.number().int().positive().default(180),
  CACHE_TTL_BAZAAR: z.coerce.number().int().positive().default(45),
  CACHE_TTL_AUCTIONS: z.coerce.number().int().positive().default(120),
  CACHE_TTL_STATIC: z.coerce.number().int().positive().default(86400),

  // API server
  API_PORT: z.coerce.number().int().positive().default(3000),
  API_HOST: z.string().default("0.0.0.0"),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`).join("\n");
    // eslint-disable-next-line no-console
    console.error(`Invalid environment configuration:\n${issues}`);
    process.exit(1);
  }
  return parsed.data;
}

export const env = loadEnv();
