import { ProfileNetworthCalculator, UpdateManager } from "skyhelper-networth";
import { hypixelClient } from "../../hypixel/client/HypixelClient";
import { logger } from "../../utils/logger";
import type { SkyblockProfileDetail } from "./profileService";

// The library's built-in "check npm for a newer version" background poll (registry.npmjs.org,
// every 10 min) is irrelevant on a production server - disable it once at import time.
UpdateManager.disable();

export interface NetworthResult {
  networth: number;
  unsoulboundNetworth: number;
  /** True when the player's Inventory API is off - the figure is understated (coins/bank only) when this is true. */
  incomplete: boolean;
}

/**
 * Computes a player's real SkyBlock net worth using the community-maintained `skyhelper-networth`
 * library (bazaar + lowest-BIN + pet/accessory pricing data, MIT licensed, same calculation used
 * by the SkyHelper Discord bot) instead of a bazaar-only floor estimate. Museum-donated items are
 * included when available since they still count toward net worth.
 */
export async function calculateNetWorth(profile: SkyblockProfileDetail): Promise<NetworthResult> {
  let museumData: unknown;
  try {
    const museum = await hypixelClient.getMuseum(profile.profileId);
    museumData = museum.members?.[profile.uuid];
  } catch (err) {
    logger.warn({ err, profileId: profile.profileId }, "Failed to fetch museum data for net worth calculation - continuing without it");
  }

  const calculator = new ProfileNetworthCalculator(profile.rawMember as object, museumData as object | undefined, profile.bankCoins);
  const result = await calculator.getNetworth({ onlyNetworth: true });

  return {
    networth: Math.round(result.networth),
    unsoulboundNetworth: Math.round(result.unsoulboundNetworth),
    incomplete: result.noInventory,
  };
}
