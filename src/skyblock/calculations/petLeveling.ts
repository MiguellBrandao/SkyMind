export const PET_RARITY_MULTIPLIER: Record<string, number> = {
  COMMON: 1,
  UNCOMMON: 1.5,
  RARE: 2,
  EPIC: 2.5,
  LEGENDARY: 3,
  MYTHIC: 4,
};

const BASE_MAX_XP_AT_LEVEL_100_LEGENDARY = 25_353_230;

export interface ApproxPetLevel {
  level: number;
  maxLevel: number;
  confidence: "approximate";
}

/**
 * Approximates a pet's level from its total XP and rarity.
 *
 * SkyBlock's real per-level pet XP table is a non-public, piecewise curve that Hypixel does not
 * expose via the API. This uses a smooth power-curve approximation calibrated against commonly
 * published reference points - accurate enough for rough profile analysis, but NOT authoritative.
 * Prefer `search_skyblock_knowledge` when a user needs an exact per-level XP threshold.
 */
export function approximatePetLevel(xp: number, rarity: string, maxLevel = 100): ApproxPetLevel {
  const multiplier = PET_RARITY_MULTIPLIER[rarity.toUpperCase()] ?? PET_RARITY_MULTIPLIER.RARE ?? 2;
  const legendaryMultiplier = PET_RARITY_MULTIPLIER.LEGENDARY ?? 3;
  const maxXp = BASE_MAX_XP_AT_LEVEL_100_LEGENDARY * (multiplier / legendaryMultiplier);
  const ratio = Math.min(1, Math.max(0, xp) / maxXp);
  const level = Math.min(maxLevel, Math.max(xp > 0 ? 1 : 0, Math.round(ratio ** 0.45 * maxLevel)));
  return { level, maxLevel, confidence: "approximate" };
}
