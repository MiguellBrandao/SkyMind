/**
 * SkyBlock skill/dungeon XP-per-level tables.
 *
 * These are community-documented constants (SkyBlock Wiki / NotEnoughUpdates repo data) and
 * are NOT fetched live from Hypixel - Hypixel does not expose them via the API. They can drift
 * when Hyplixel changes leveling curves; treat level results derived from them as *calculated*
 * values, not live API data, and prefer `search_skyblock_knowledge` when a user asks whether a
 * specific number is still accurate.
 */

// Non-cumulative XP required to go from level N-1 to level N, for the "standard" skills
// (Farming, Mining, Combat, Foraging, Fishing, Enchanting, Alchemy, Taming, Carpentry).
export const STANDARD_SKILL_XP_PER_LEVEL: number[] = [
  50, 125, 200, 300, 500, 750, 1_000, 1_500, 2_000, 3_500, 5_000, 7_500, 10_000, 15_000, 20_000, 30_000, 50_000, 75_000, 100_000, 200_000, 300_000, 400_000,
  500_000, 600_000, 700_000, 800_000, 900_000, 1_000_000, 1_100_000, 1_200_000, 1_300_000, 1_400_000, 1_500_000, 1_600_000, 1_700_000, 1_800_000, 1_900_000,
  2_000_000, 2_100_000, 2_200_000, 2_300_000, 2_400_000, 2_500_000, 2_600_000, 2_750_000, 2_900_000, 3_100_000, 3_300_000, 3_600_000, 3_900_000, 4_200_000,
  4_500_000, 4_800_000, 5_100_000, 5_400_000, 5_700_000, 6_000_000, 6_300_000, 6_600_000, 6_900_000,
];

// Runecrafting and Social caps at level 25 with a steeper, shorter curve.
export const SHORT_SKILL_XP_PER_LEVEL: number[] = [
  50, 100, 125, 160, 200, 250, 315, 400, 500, 625, 785, 1_000, 1_250, 1_600, 2_000, 2_465, 3_125, 4_000, 5_000, 6_200, 7_800, 9_800, 12_200, 15_300, 19_050,
];

// Catacombs + dungeon class XP-per-level, capped at level 50.
export const DUNGEON_XP_PER_LEVEL: number[] = [
  50, 75, 110, 160, 230, 330, 470, 670, 950, 1_340, 1_890, 2_660, 3_760, 5_270, 7_380, 10_300, 14_400, 20_000, 27_600, 38_000, 52_500, 71_500, 97_000,
  132_000, 180_000, 243_000, 328_000, 445_000, 600_000, 800_000, 1_065_000, 1_410_000, 1_900_000, 2_500_000, 3_300_000, 4_300_000, 5_600_000, 7_200_000,
  9_200_000, 12_000_000, 15_000_000, 19_000_000, 24_000_000, 30_000_000, 38_000_000, 48_000_000, 60_000_000, 75_000_000, 93_000_000, 116_250_000,
];

export const SKILL_MAX_LEVELS: Record<string, number> = {
  farming: 60,
  mining: 60,
  combat: 60,
  foraging: 50,
  fishing: 50,
  enchanting: 60,
  alchemy: 50,
  taming: 60,
  carpentry: 50,
  runecrafting: 25,
  social: 25,
};

export interface LevelResult {
  level: number;
  maxLevel: number;
  currentXp: number;
  xpIntoLevel: number;
  xpForNextLevel: number | null;
  progressToNext: number;
}

function levelFromTable(xp: number, table: number[], maxLevel: number): LevelResult {
  let cumulative = 0;
  let level = 0;

  for (let i = 0; i < table.length && level < maxLevel; i++) {
    const needed = table[i] as number;
    if (xp < cumulative + needed) {
      const xpIntoLevel = xp - cumulative;
      return {
        level,
        maxLevel,
        currentXp: xp,
        xpIntoLevel,
        xpForNextLevel: needed,
        progressToNext: needed > 0 ? xpIntoLevel / needed : 0,
      };
    }
    cumulative += needed;
    level++;
  }

  return { level, maxLevel, currentXp: xp, xpIntoLevel: xp - cumulative, xpForNextLevel: null, progressToNext: 1 };
}

export function getSkillLevel(skillName: string, xp: number): LevelResult {
  const key = skillName.toLowerCase();
  const maxLevel = SKILL_MAX_LEVELS[key] ?? 50;
  const table = key === "runecrafting" || key === "social" ? SHORT_SKILL_XP_PER_LEVEL : STANDARD_SKILL_XP_PER_LEVEL;
  return levelFromTable(xp, table, Math.min(maxLevel, table.length));
}

export function getDungeonLevel(xp: number, maxLevel = 50): LevelResult {
  return levelFromTable(xp, DUNGEON_XP_PER_LEVEL, Math.min(maxLevel, DUNGEON_XP_PER_LEVEL.length));
}
