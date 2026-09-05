import { gunzipSync } from "node:zlib";
import * as nbt from "prismarine-nbt";
import { logger } from "../../utils/logger";
import { extractRarityFromLore, stripColorCodes } from "./colorCodes";

export interface SkyblockItem {
  slot: number;
  minecraftId: number | null;
  count: number;
  skyblockItemId: string | null;
  displayName: string | null;
  lore: string[];
  rarity: string | null;
  enchantments: Record<string, number>;
}

interface RawNbtItem {
  id?: number;
  Count?: number;
  Damage?: number;
  tag?: {
    display?: { Name?: string; Lore?: string[] };
    ExtraAttributes?: { id?: string; enchantments?: Record<string, number>; [key: string]: unknown };
    ench?: unknown[];
  };
}

function toBuffer(base64: string): Buffer {
  const raw = Buffer.from(base64, "base64");
  try {
    return gunzipSync(raw);
  } catch {
    return raw; // Not gzipped; assume already raw NBT bytes.
  }
}

/**
 * Decodes a Hypixel `inv_contents`-style base64 gzip-NBT blob into a flat array of items.
 * Empty inventory slots come back as empty NBT compounds and are represented as `null`-ish
 * placeholder items (minecraftId: null) rather than being dropped, to preserve slot indices.
 */
export async function decodeItemBytes(base64: string): Promise<SkyblockItem[]> {
  if (!base64) return [];

  const buffer = toBuffer(base64);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsed: any;
  try {
    const result = await nbt.parse(buffer);
    parsed = result.parsed;
  } catch (err) {
    logger.warn({ err }, "Failed to parse item NBT bytes");
    return [];
  }

  const simplified = nbt.simplify(parsed) as { i?: RawNbtItem[] };
  const rawItems = simplified.i ?? [];

  return rawItems.map((item, slot) => {
    if (!item || item.id === undefined) {
      return {
        slot,
        minecraftId: null,
        count: 0,
        skyblockItemId: null,
        displayName: null,
        lore: [],
        rarity: null,
        enchantments: {},
      };
    }

    const lore = (item.tag?.display?.Lore ?? []).map(stripColorCodes);
    const displayName = item.tag?.display?.Name ? stripColorCodes(item.tag.display.Name) : null;

    return {
      slot,
      minecraftId: item.id ?? null,
      count: item.Count ?? 1,
      skyblockItemId: item.tag?.ExtraAttributes?.id ?? null,
      displayName,
      lore,
      rarity: extractRarityFromLore(lore),
      enchantments: (item.tag?.ExtraAttributes?.enchantments as Record<string, number> | undefined) ?? {},
    };
  });
}

export async function decodeItemBytesSafe(base64: string | undefined | null): Promise<SkyblockItem[]> {
  if (!base64) return [];
  try {
    return await decodeItemBytes(base64);
  } catch (err) {
    logger.warn({ err }, "decodeItemBytesSafe failed");
    return [];
  }
}
