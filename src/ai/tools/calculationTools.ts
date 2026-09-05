import { z } from "zod";
import { calculateDamage, calculateEffectiveHealth, calculateMagicalPower } from "../../skyblock/calculations";
import { itemLookupService } from "../../skyblock/services/itemLookupService";
import { marketService } from "../../skyblock/services/marketService";
import { defineTool } from "./types";

export const compareItemsTool = defineTool({
  name: "compare_items",
  description: "Compares 2-4 SkyBlock items side by side: base stats (from Hypixel's item resource), rarity, and current market price (Bazaar or lowest Auction House BIN). Use this before recommending one item over another.",
  category: "calculation",
  schema: z.object({
    items: z
      .array(z.string().min(1))
      .min(2)
      .max(4)
      .describe("Item IDs or display names to compare, e.g. ['HYPERION', 'ASTRAEA'] or ['Hyperion', 'Astraea']."),
  }),
  handler: async (args) => {
    const results = await Promise.all(
      args.items.map(async (idOrName) => {
        const def = await itemLookupService.resolve(idOrName);
        if (!def) {
          return { query: idOrName, found: false as const };
        }
        const [bazaar, auction] = await Promise.all([marketService.getBazaarPrice(def.id), marketService.getAuctionStats(def.name ?? def.id, { binOnly: true, sampleLimit: 1 })]);
        return {
          query: idOrName,
          found: true as const,
          id: def.id,
          name: def.name ?? def.id,
          tier: def.tier ?? "UNKNOWN",
          category: def.category ?? "UNKNOWN",
          stats: def.stats ?? {},
          npcSellPrice: def.npc_sell_price ?? null,
          bazaarSellPrice: bazaar?.sellPrice ?? null,
          lowestAuctionBin: auction?.lowestBinPrice ?? null,
        };
      }),
    );
    return { comparison: results };
  },
});

export const calculateDamageTool = defineTool({
  name: "calculate_damage",
  description: "Calculates hit damage using SkyBlock's standard damage formula from weapon damage, strength, crit damage, and crit chance stats. Optionally factors in a target's defense.",
  category: "calculation",
  schema: z.object({
    weaponDamage: z.number().min(0).describe("The weapon's base Damage stat."),
    strength: z.number().min(0).describe("Total Strength stat."),
    critDamage: z.number().min(0).describe("Total Crit Damage stat (percentage points)."),
    critChance: z.number().min(0).max(100).describe("Total Crit Chance stat (0-100)."),
    targetDefense: z.number().min(0).optional().describe("Optional: the target mob's Defense stat, to compute mitigated damage."),
  }),
  handler: async (args) => calculateDamage(args),
});

export const calculateEffectiveHealthTool = defineTool({
  name: "calculate_effective_health",
  description: "Calculates Effective Health Pool (EHP) and damage reduction percentage from Health and Defense stats using SkyBlock's standard formula.",
  category: "calculation",
  schema: z.object({
    health: z.number().min(0).describe("Total Health stat."),
    defense: z.number().min(0).describe("Total Defense stat."),
  }),
  handler: async (args) => calculateEffectiveHealth(args),
});

export const calculateMagicPowerTool = defineTool({
  name: "calculate_magic_power",
  description: "Calculates total Magical Power for a hypothetical set of accessories given their rarities. For a player's CURRENT actual magical power, use get_accessories instead - this tool is for 'what if I upgraded X' scenarios.",
  category: "calculation",
  schema: z.object({
    accessoryRarities: z.array(z.string().min(1)).min(1).describe("List of rarities, one per accessory, e.g. ['LEGENDARY', 'EPIC', 'EPIC']."),
  }),
  handler: async (args) => calculateMagicalPower(args.accessoryRarities.map((rarity) => ({ rarity }))),
});
