import { env } from "../../config/env";
import { logger } from "../../utils/logger";
import { ICON_MANIFEST, minecraftItemTextureUrl } from "./iconManifest";

const API_BASE = "https://discord.com/api/v10";
const UPLOAD_DELAY_MS = 400;

interface DiscordEmoji {
  id: string;
  name: string;
}

async function discordApi<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    throw new Error(`Discord API ${res.status} ${res.statusText}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface EmojiSyncResult {
  mapping: Record<string, string>;
  uploaded: number;
  reused: number;
  failed: number;
}

/**
 * Ensures SkyMind's Minecraft-icon set exists as Discord Application Emoji, uploading whichever
 * are missing (idempotent: checks existing names first, so a normal run after the first is just
 * one GET request). Called automatically at bot startup - see index.ts - so there's no separate
 * manual step, and nothing to keep in sync across container restarts/redeploys.
 */
export async function syncCustomEmojis(): Promise<EmojiSyncResult> {
  const existing = await discordApi<{ items: DiscordEmoji[] }>(`${API_BASE}/applications/${env.DISCORD_CLIENT_ID}/emojis`);
  const existingByName = new Map(existing.items.map((e) => [e.name, e.id]));

  const mapping: Record<string, string> = {};
  let uploaded = 0;
  let failed = 0;

  for (const [key, itemName] of Object.entries(ICON_MANIFEST)) {
    const emojiName = `sm_${key}`;
    const existingId = existingByName.get(emojiName);
    if (existingId) {
      mapping[key] = existingId;
      continue;
    }

    try {
      const imageRes = await fetch(minecraftItemTextureUrl(itemName));
      if (!imageRes.ok) throw new Error(`Failed to download ${itemName}.png: HTTP ${imageRes.status}`);
      const buffer = Buffer.from(await imageRes.arrayBuffer());
      const dataUri = `data:image/png;base64,${buffer.toString("base64")}`;

      const created = await discordApi<DiscordEmoji>(`${API_BASE}/applications/${env.DISCORD_CLIENT_ID}/emojis`, {
        method: "POST",
        body: JSON.stringify({ name: emojiName, image: dataUri }),
      });
      mapping[key] = created.id;
      uploaded++;
      await sleep(UPLOAD_DELAY_MS);
    } catch (err) {
      failed++;
      logger.warn({ err, key, itemName }, "Failed to upload Minecraft icon emoji - falling back to Unicode for this one");
    }
  }

  return { mapping, uploaded, reused: Object.keys(mapping).length - uploaded, failed };
}
