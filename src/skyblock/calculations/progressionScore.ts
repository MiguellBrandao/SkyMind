export const RARITY_SCORE: Record<string, number> = {
  COMMON: 10,
  UNCOMMON: 25,
  RARE: 45,
  EPIC: 65,
  LEGENDARY: 85,
  MYTHIC: 100,
  SPECIAL: 85,
  "VERY SPECIAL": 100,
  DIVINE: 100,
  ADMIN: 100,
};

export interface ProgressionMetrics {
  combatSkillLevel: number;
  slayerLevels: number[];
  catacombsLevel: number;
  classAverageLevel: number;
  magicalPower: number;
  activePetLevel: number | null;
  activePetRarity: string | null;
  equipmentRarities: string[];
  estimatedNetWorth: number;
  skyblockLevel: number;
  skillAverage: number;
}

export interface CategoryScores {
  combat: number;
  dungeons: number;
  accessories: number;
  pets: number;
  equipment: number;
  economy: number;
  progression: number;
  overall: number;
}

function clampScore(value: number): number {
  return Math.round(Math.min(100, Math.max(0, value)) * 10) / 10;
}

function rarityScore(rarity: string | null): number {
  if (!rarity) return 0;
  return RARITY_SCORE[rarity.toUpperCase()] ?? 0;
}

/**
 * SkyMind's own 0-100 heuristic progression scoring, NOT an official Hypixel statistic.
 * Soft caps are calibrated against typical "solid mid-to-late-game" benchmarks so a
 * genuinely maxed account should land near 100 in most categories.
 */
export function computeCategoryScores(metrics: ProgressionMetrics): CategoryScores {
  const combatSkillScore = (metrics.combatSkillLevel / 60) * 100;
  const slayerScore = metrics.slayerLevels.length > 0 ? (metrics.slayerLevels.reduce((a, b) => a + b, 0) / (metrics.slayerLevels.length * 9)) * 100 : combatSkillScore;
  const combat = clampScore(combatSkillScore * 0.5 + slayerScore * 0.5);

  const dungeons = clampScore((metrics.catacombsLevel / 50) * 60 + (metrics.classAverageLevel / 50) * 40);

  const accessories = clampScore((metrics.magicalPower / 400) * 100);

  const pets = clampScore(metrics.activePetLevel === null ? 0 : (metrics.activePetLevel / 100) * 70 + rarityScore(metrics.activePetRarity) * 0.3);

  const equipment =
    metrics.equipmentRarities.length > 0
      ? clampScore(metrics.equipmentRarities.reduce((sum, r) => sum + rarityScore(r), 0) / metrics.equipmentRarities.length)
      : 0;

  const economy = clampScore((Math.log10(Math.max(0, metrics.estimatedNetWorth) + 1) / 9) * 100);

  const progression = clampScore((metrics.skyblockLevel / 320) * 50 + (metrics.skillAverage / 50) * 50);

  const overall = clampScore((combat + dungeons + accessories + pets + equipment + economy + progression) / 7);

  return { combat, dungeons, accessories, pets, equipment, economy, progression, overall };
}
