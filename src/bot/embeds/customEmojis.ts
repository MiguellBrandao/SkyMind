import { logger } from "../../utils/logger";

let emojiIds: Record<string, string> = {};

/**
 * Returns a custom Discord emoji tag (real Minecraft icon) if the startup sync (see emojiSync.ts,
 * run automatically every time the bot boots) resolved one, otherwise a Unicode fallback. Reads
 * `emojiIds` fresh on every call (not cached at import time), so it starts returning real icons
 * the moment the sync finishes without needing a restart.
 */
export function icon(key: string, fallback: string): string {
  const id = emojiIds[key];
  return id ? `<:sm_${key}:${id}>` : fallback;
}

export function setCustomEmojiIds(ids: Record<string, string>): void {
  emojiIds = ids;
  logger.info({ count: Object.keys(ids).length }, "Custom Minecraft-icon emoji mapping is live");
}
