import { startApiServer } from "./api/server";
import { createDiscordClient } from "./bot/client";
import { setCustomEmojiIds } from "./bot/embeds/customEmojis";
import { syncCustomEmojis } from "./bot/embeds/emojiSync";
import { registerEvents } from "./bot/events";
import { env } from "./config/env";
import { checkDatabaseHealth, closeDatabase } from "./database/client";
import { checkRedisHealth, closeRedis } from "./services/redisClient";
import { logger } from "./utils/logger";

async function syncEmojisInBackground(): Promise<void> {
  try {
    const result = await syncCustomEmojis();
    setCustomEmojiIds(result.mapping);
    if (result.uploaded > 0 || result.failed > 0) {
      logger.info(result, "Minecraft icon emoji sync finished");
    }
  } catch (err) {
    logger.warn({ err }, "Minecraft icon emoji sync failed - embeds will use Unicode fallback icons");
  }
}

async function main(): Promise<void> {
  const [dbOk, redisOk] = await Promise.all([checkDatabaseHealth(), checkRedisHealth()]);
  if (!dbOk) logger.warn("Database health check failed at startup - some features won't work until it's reachable. Did you run `npm run db:migrate`?");
  if (!redisOk) logger.warn("Redis health check failed at startup - caching will be degraded until it's reachable.");

  const client = createDiscordClient();
  registerEvents(client);
  await Promise.all([client.login(env.DISCORD_BOT_TOKEN), syncEmojisInBackground()]);

  const apiServer = await startApiServer();

  let shuttingDown = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, "Shutting down SkyMind...");
    await Promise.allSettled([client.destroy(), apiServer.close(), closeDatabase(), closeRedis()]);
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  process.on("unhandledRejection", (err) => {
    logger.error({ err }, "Unhandled promise rejection");
  });
  process.on("uncaughtException", (err) => {
    logger.error({ err }, "Uncaught exception");
  });
}

main().catch((err) => {
  logger.error({ err }, "Fatal error during startup");
  process.exit(1);
});
