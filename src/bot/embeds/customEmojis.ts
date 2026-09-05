import { readFileSync } from "node:fs";
import path from "node:path";
import { logger } from "../../utils/logger";

const EMOJI_MAP_PATH = path.join(process.cwd(), "data", "customEmojis.generated.json");

let emojiIds: Record<string, string> = {};

try {
  emojiIds = JSON.parse(readFileSync(EMOJI_MAP_PATH, "utf8")) as Record<string, string>;
} catch {
  logger.info("No custom Minecraft-icon emoji mapping found - falling back to Unicode emoji. Run `npm run emojis:upload` to enable real icons.");
}

/** Returns a custom Discord emoji tag (real Minecraft icon) if `npm run emojis:upload` has been run, otherwise a Unicode fallback. */
export function icon(key: string, fallback: string): string {
  const id = emojiIds[key];
  return id ? `<:sm_${key}:${id}>` : fallback;
}
