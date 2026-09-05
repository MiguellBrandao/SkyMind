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

export interface NetworthCategory {
  key: string;
  label: string;
  total: number;
}

export interface DetailedNetworthResult extends NetworthResult {
  purse: number;
  bank: number;
  categories: NetworthCategory[];
}

const CATEGORY_LABELS: Record<string, string> = {
  armor: "Armor",
  equipment: "Equipment",
  wardrobe: "Wardrobe",
  inventory: "Inventory",
  enderchest: "Ender Chest",
  accessories: "Accessories",
  personal_vault: "Personal Vault",
  fishing_bag: "Fishing Bag",
  potion_bag: "Potion Bag",
  sacks_bag: "Sacks Bag",
  candy_inventory: "Candy Inventory",
  carnival_mask_inventory: "Carnival Mask Inventory",
  storage: "Storage",
  museum: "Museum",
  sacks: "Sacks",
  essence: "Essence",
  pets: "Pets",
  quiver: "Quiver",
  farming_toolkit: "Farming Toolkit",
  hunting_toolkit: "Hunting Toolkit",
};

async function getMuseumData(profile: SkyblockProfileDetail): Promise<unknown> {
  try {
    const museum = await hypixelClient.getMuseum(profile.profileId);
    return museum.members?.[profile.uuid];
  } catch (err) {
    logger.warn({ err, profileId: profile.profileId }, "Failed to fetch museum data for net worth calculation - continuing without it");
    return undefined;
  }
}

/**
 * Computes a player's real SkyBlock net worth using the community-maintained `skyhelper-networth`
 * library (bazaar + lowest-BIN + pet/accessory pricing data, MIT licensed, same calculation used
 * by the SkyHelper Discord bot) instead of a bazaar-only floor estimate. Museum-donated items are
 * included when available since they still count toward net worth.
 */
export async function calculateNetWorth(profile: SkyblockProfileDetail): Promise<NetworthResult> {
  const museumData = await getMuseumData(profile);
  const calculator = new ProfileNetworthCalculator(profile.rawMember as object, museumData as object | undefined, profile.bankCoins);
  const result = await calculator.getNetworth({ onlyNetworth: true });

  return {
    networth: Math.round(result.networth),
    unsoulboundNetworth: Math.round(result.unsoulboundNetworth),
    incomplete: result.noInventory,
  };
}

/** Same as calculateNetWorth, but also breaks the total down by inventory/category for a detailed view (/networth). */
export async function calculateDetailedNetWorth(profile: SkyblockProfileDetail): Promise<DetailedNetworthResult> {
  const museumData = await getMuseumData(profile);
  const calculator = new ProfileNetworthCalculator(profile.rawMember as object, museumData as object | undefined, profile.bankCoins);
  const result = await calculator.getNetworth({ onlyNetworth: false });

  const categories = Object.entries(result.types)
    .map(([key, value]) => ({ key, label: CATEGORY_LABELS[key] ?? key, total: Math.round(value.total) }))
    .filter((category) => category.total > 0)
    .sort((a, b) => b.total - a.total);

  return {
    networth: Math.round(result.networth),
    unsoulboundNetworth: Math.round(result.unsoulboundNetworth),
    incomplete: result.noInventory,
    purse: Math.round(result.purse),
    bank: Math.round(result.bank),
    categories,
  };
}
