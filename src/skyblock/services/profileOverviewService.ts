import { hypixelClient } from "../../hypixel/client/HypixelClient";
import { computeCollectionTiers, countMaxedCollections, countTotalCollections } from "../../hypixel/parsers/collectionsParser";
import { calculateNetWorth } from "./networthService";
import type { SkyblockProfileDetail } from "./profileService";

export interface ProfileOverviewExtras {
  estimatedNetWorth: number;
  netWorthIncomplete: boolean;
  collectionsSummary: { maxed: number; total: number } | null;
}

/** Extras shown on the /profile overview card beyond the base snapshot/detail data. */
export async function getProfileOverviewExtras(detail: SkyblockProfileDetail): Promise<ProfileOverviewExtras> {
  const [netWorth, collectionsResource] = await Promise.all([calculateNetWorth(detail), hypixelClient.getResource("collections")]);

  let collectionsSummary: { maxed: number; total: number } | null = null;
  if (Object.keys(detail.rawCollections).length > 0) {
    const tiers = computeCollectionTiers(detail.rawCollections, collectionsResource);
    collectionsSummary = { maxed: countMaxedCollections(tiers), total: countTotalCollections(collectionsResource) };
  }

  return {
    estimatedNetWorth: netWorth.networth,
    netWorthIncomplete: netWorth.incomplete,
    collectionsSummary,
  };
}
