import { hypixelClient } from "../../hypixel/client/HypixelClient";
import { computeCollectionTiers, countMaxedCollections, countTotalCollections } from "../../hypixel/parsers/collectionsParser";
import { estimateNetWorth } from "../calculations";
import { marketService } from "./marketService";
import type { SkyblockProfileDetail } from "./profileService";

export interface ProfileOverviewExtras {
  estimatedNetWorth: number;
  netWorthConfidence: "high" | "medium" | "low";
  collectionsSummary: { maxed: number; total: number } | null;
}

/** Cheap extras shown on the /profile overview card that need one extra Hypixel call (bazaar + collections resource, both cached). */
export async function getProfileOverviewExtras(detail: SkyblockProfileDetail): Promise<ProfileOverviewExtras> {
  const [bazaar, collectionsResource] = await Promise.all([hypixelClient.getBazaar(), hypixelClient.getResource("collections")]);

  const priceLookup = marketService.buildBazaarPriceLookup(bazaar.products ?? {});
  const netWorth = estimateNetWorth({
    purseCoins: detail.purseCoins,
    bankCoins: detail.bankCoins,
    items: [...detail.inventory, ...detail.armor, ...detail.enderChest, ...detail.accessories].map((item) => ({
      skyblockItemId: item.skyblockItemId,
      count: item.count,
    })),
    priceLookup,
  });

  let collectionsSummary: { maxed: number; total: number } | null = null;
  if (Object.keys(detail.rawCollections).length > 0) {
    const tiers = computeCollectionTiers(detail.rawCollections, collectionsResource);
    collectionsSummary = { maxed: countMaxedCollections(tiers), total: countTotalCollections(collectionsResource) };
  }

  return {
    estimatedNetWorth: netWorth.estimatedTotal,
    netWorthConfidence: netWorth.confidence,
    collectionsSummary,
  };
}
