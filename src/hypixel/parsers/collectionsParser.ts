import { firstDefinedPath } from "../../utils/objectPath";

export interface CollectionProgress {
  itemId: string;
  amount: number;
  tier: number;
  maxTier: number;
  amountForNextTier: number | null;
}

interface CollectionTierDef {
  tier: number;
  amountRequired: number;
}

interface CollectionCategoryShape {
  items?: Record<string, { maxTiers?: number; tiers?: CollectionTierDef[] }>;
}

/** Loosely typed on purpose: this mirrors HypixelResourceResponse.collections, which is a
 * passthrough `Record<string, unknown>` since the full resource schema is large and rarely used
 * elsewhere. Shape is validated defensively at each access below instead of via Zod. */
interface CollectionResourceShape {
  collections?: Record<string, unknown>;
}

export function parseRawCollections(member: unknown): Record<string, number> {
  return firstDefinedPath<Record<string, number>>(member, ["collection"], {});
}

export function computeCollectionTiers(rawCollections: Record<string, number>, resource: CollectionResourceShape): Record<string, CollectionProgress> {
  const categories = resource.collections ?? {};
  const result: Record<string, CollectionProgress> = {};

  for (const [itemId, amount] of Object.entries(rawCollections)) {
    let tiers: CollectionTierDef[] | undefined;
    let maxTier = 0;

    for (const rawCategory of Object.values(categories)) {
      const category = rawCategory as CollectionCategoryShape;
      const itemDef = category.items?.[itemId];
      if (itemDef) {
        tiers = itemDef.tiers;
        maxTier = itemDef.maxTiers ?? tiers?.length ?? 0;
        break;
      }
    }

    if (!tiers) {
      result[itemId] = { itemId, amount, tier: 0, maxTier: 0, amountForNextTier: null };
      continue;
    }

    let currentTier = 0;
    let amountForNextTier: number | null = null;
    for (const def of tiers) {
      if (amount >= def.amountRequired) {
        currentTier = def.tier;
      } else {
        amountForNextTier = def.amountRequired;
        break;
      }
    }

    result[itemId] = { itemId, amount, tier: currentTier, maxTier, amountForNextTier };
  }

  return result;
}

/** Total number of collections that exist in the game (across all categories), per Hypixel's resource data. */
export function countTotalCollections(resource: CollectionResourceShape): number {
  const categories = resource.collections ?? {};
  let total = 0;
  for (const rawCategory of Object.values(categories)) {
    const category = rawCategory as CollectionCategoryShape;
    total += Object.keys(category.items ?? {}).length;
  }
  return total;
}

/** How many of the player's collections are at their maximum tier. */
export function countMaxedCollections(tiers: Record<string, CollectionProgress>): number {
  return Object.values(tiers).filter((progress) => progress.maxTier > 0 && progress.tier >= progress.maxTier).length;
}
