import { syncCustomEmojis } from "../src/bot/embeds/emojiSync";
import { logger } from "../src/utils/logger";

/**
 * Manual/CLI wrapper around the same sync the bot now runs automatically on every startup (see
 * src/index.ts). Useful for pre-warming the icon set or debugging without starting the whole bot -
 * not required for normal operation anymore.
 */
async function main(): Promise<void> {
  logger.info("Syncing Minecraft icon emoji set...");
  const result = await syncCustomEmojis();
  logger.info({ uploaded: result.uploaded, reused: result.reused, failed: result.failed, total: Object.keys(result.mapping).length }, "Emoji sync complete");
}

main().catch((err) => {
  logger.error({ err }, "Emoji sync script crashed");
  process.exit(1);
});
