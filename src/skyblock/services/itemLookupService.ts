import { hypixelClient } from "../../hypixel/client/HypixelClient";
import type { SkyblockItemDefinition } from "../../hypixel/client/types";

export const itemLookupService = {
  async findById(itemId: string): Promise<SkyblockItemDefinition | null> {
    const items = await hypixelClient.getItemsResource();
    return items.find((item) => item.id.toUpperCase() === itemId.toUpperCase()) ?? null;
  },

  async searchByName(query: string, limit = 5): Promise<SkyblockItemDefinition[]> {
    const items = await hypixelClient.getItemsResource();
    const q = query.toLowerCase();
    return items.filter((item) => item.name?.toLowerCase().includes(q) || item.id.toLowerCase().includes(q)).slice(0, limit);
  },

  /** Resolves a user-provided string that may be an exact item ID or a fuzzy display name. */
  async resolve(idOrName: string): Promise<SkyblockItemDefinition | null> {
    const exact = await this.findById(idOrName);
    if (exact) return exact;
    const matches = await this.searchByName(idOrName, 1);
    return matches[0] ?? null;
  },
};
