import { cacheTtl } from "../../config";
import { PlayerNotFoundError } from "../../utils/errors";
import { logger } from "../../utils/logger";
import { cacheKeys } from "../cache/cacheKeys";
import { getOrSetCache } from "../cache/cachedFetch";
import { mojangProfileSchema, type MojangProfile } from "./types";

const REQUEST_TIMEOUT_MS = 8000;

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Unexpected status ${res.status} from ${url}`);
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeUuid(uuid: string): string {
  return uuid.replace(/-/g, "").toLowerCase();
}

async function resolveViaMojang(ign: string): Promise<MojangProfile | null> {
  const data = await fetchJson(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(ign)}`);
  if (!data) return null;
  return mojangProfileSchema.parse(data);
}

async function resolveViaPlayerDb(ign: string): Promise<MojangProfile | null> {
  const data = (await fetchJson(`https://playerdb.co/api/player/minecraft/${encodeURIComponent(ign)}`)) as
    | { success?: boolean; data?: { player?: { id?: string; username?: string } } }
    | null;
  const player = data?.data?.player;
  if (!data?.success || !player?.id || !player.username) return null;
  return { id: player.id, name: player.username };
}

/** Resolves a Minecraft IGN to its UUID, trying Mojang first and falling back to PlayerDB if Mojang is unavailable. */
export async function resolveIgnToUuid(ign: string): Promise<{ uuid: string; username: string }> {
  const cacheKey = cacheKeys.mojangUuid(ign);

  return getOrSetCache(cacheKey, cacheTtl.static, async () => {
    let profile: MojangProfile | null = null;

    try {
      profile = await resolveViaMojang(ign);
    } catch (err) {
      logger.warn({ err, ign }, "Mojang UUID lookup failed, falling back to PlayerDB");
    }

    if (!profile) {
      try {
        profile = await resolveViaPlayerDb(ign);
      } catch (err) {
        logger.warn({ err, ign }, "PlayerDB UUID lookup fallback also failed");
      }
    }

    if (!profile) {
      throw new PlayerNotFoundError(ign);
    }

    return { uuid: normalizeUuid(profile.id), username: profile.name };
  });
}
