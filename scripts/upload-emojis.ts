import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { ICON_MANIFEST, minecraftItemTextureUrl } from "../src/bot/embeds/iconManifest";
import { env } from "../src/config/env";
import { logger } from "../src/utils/logger";

const API_BASE = "https://discord.com/api/v10";
const OUTPUT_PATH = path.join(process.cwd(), "data", "customEmojis.generated.json");
const UPLOAD_DELAY_MS = 500;

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

/**
 * Uploads SkyMind's Minecraft-item icon set as Discord Application Emoji so embeds can use real
 * game icons (`<:sm_x:id>`) instead of Unicode. Idempotent: already-uploaded names are reused
 * rather than re-uploaded, so it's safe (and cheap) to re-run after every redeploy.
 */
async function main(): Promise<void> {
  logger.info("Fetching existing application emojis...");
  const existing = await discordApi<{ items: DiscordEmoji[] }>(`${API_BASE}/applications/${env.DISCORD_CLIENT_ID}/emojis`);
  const existingByName = new Map(existing.items.map((e) => [e.name, e.id]));

  const result: Record<string, string> = {};
  let uploaded = 0;
  let reused = 0;
  let failed = 0;

  for (const [key, itemName] of Object.entries(ICON_MANIFEST)) {
    const emojiName = `sm_${key}`;
    const existingId = existingByName.get(emojiName);
    if (existingId) {
      result[key] = existingId;
      reused++;
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
      result[key] = created.id;
      uploaded++;
      logger.info({ key, itemName }, "Uploaded icon");
    } catch (err) {
      failed++;
      logger.error({ err, key, itemName }, "Failed to upload icon - will fall back to Unicode for this one");
    }

    await sleep(UPLOAD_DELAY_MS);
  }

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(result, null, 2));

  logger.info({ uploaded, reused, failed, total: Object.keys(ICON_MANIFEST).length, path: OUTPUT_PATH }, "Emoji upload complete");
}

main().catch((err) => {
  logger.error({ err }, "Emoji upload script crashed");
  process.exit(1);
});
