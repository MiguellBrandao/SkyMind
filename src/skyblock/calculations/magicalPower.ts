// Magical power contributed per accessory rarity - widely documented SkyBlock constants.
export const MAGICAL_POWER_BY_RARITY: Record<string, number> = {
  COMMON: 3,
  UNCOMMON: 5,
  RARE: 8,
  EPIC: 12,
  LEGENDARY: 16,
  MYTHIC: 22,
  SPECIAL: 16,
  "VERY SPECIAL": 24,
};

export interface MagicalPowerInput {
  rarity: string;
}

/**
 * Sums magical power for a hypothetical set of accessories (e.g. when a user asks
 * "what if I upgraded my Rings to Legendary?"). For a player's *actual current* magical
 * power, prefer the live `accessory_bag_storage.highest_magical_power` API field instead -
 * this calculator is for what-if comparisons, not a replacement for live data.
 */
export function calculateMagicalPower(accessories: MagicalPowerInput[]): { totalMagicalPower: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {};
  let total = 0;

  for (const accessory of accessories) {
    const rarity = accessory.rarity.toUpperCase();
    const power = MAGICAL_POWER_BY_RARITY[rarity] ?? 0;
    breakdown[rarity] = (breakdown[rarity] ?? 0) + power;
    total += power;
  }

  return { totalMagicalPower: total, breakdown };
}
