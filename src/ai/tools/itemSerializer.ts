import type { SkyblockItem } from "../../hypixel/parsers/nbt";

const MAX_ITEMS_IN_RESPONSE = 60;

/** Trims decoded inventory items down to a compact, LLM-friendly shape (drops empty slots, caps count). */
export function serializeItems(items: SkyblockItem[]) {
  return items
    .filter((item) => item.minecraftId !== null)
    .slice(0, MAX_ITEMS_IN_RESPONSE)
    .map((item) => ({
      slot: item.slot,
      name: item.displayName,
      skyblockItemId: item.skyblockItemId,
      rarity: item.rarity,
      count: item.count,
      enchantments: item.enchantments,
    }));
}
