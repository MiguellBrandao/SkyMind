import { getSkillLevel, type LevelResult } from "../../skyblock/calculations/xpTables";
import { firstDefinedPath, getPath } from "../../utils/objectPath";

export const ALL_SKILLS = ["farming", "mining", "combat", "foraging", "fishing", "enchanting", "alchemy", "taming", "carpentry", "runecrafting", "social"] as const;
export type SkillName = (typeof ALL_SKILLS)[number];

// Skills counted toward the in-game "Skill Average" stat.
export const SKILL_AVERAGE_SKILLS: SkillName[] = ["farming", "mining", "combat", "foraging", "fishing", "enchanting", "alchemy", "taming"];

const BASE_SKILL_CAP = 50;
const EXTENDED_SKILL_CAP = 60;

export interface ParsedSkills {
  skills: Partial<Record<SkillName, LevelResult>>;
  skillAverage: number;
}

function readSkillXp(member: unknown, skill: SkillName): number {
  const key = `SKILL_${skill.toUpperCase()}`;
  return firstDefinedPath<number>(member, [`player_data.experience.${key}`, `experience_skill_${skill}`], 0);
}

/**
 * Taming's level cap is 50 by default and only reaches 60 once the player has sacrificed pets to
 * George (one unique pet type sacrificed = +1 cap). Verified against the live API field.
 */
function tamingLevelCap(member: unknown): number {
  const sacrificed = getPath<string[]>(member, "pets_data.pet_care.pet_types_sacrificed", []);
  return Math.min(BASE_SKILL_CAP + new Set(sacrificed).size, EXTENDED_SKILL_CAP);
}

/**
 * Farming's level cap is similarly 50 by default, extended to 60 by buying cap upgrades from
 * Anita with Jacob's Contest medals/tickets. Uses the general "perk" field pattern Hypixel stores
 * Jacob's Contest upgrades under - lower confidence than tamingLevelCap since it wasn't possible
 * to verify this exact path against a live example; falls back to the base cap (50) if absent,
 * which understates a maxed player rather than overstating an unfinished one.
 */
function farmingLevelCap(member: unknown): number {
  const capLevel = getPath<number>(member, "jacob2.perks.farming_level_cap", 0);
  return Math.min(BASE_SKILL_CAP + capLevel, EXTENDED_SKILL_CAP);
}

export function parseSkills(member: unknown): ParsedSkills {
  const skills: Partial<Record<SkillName, LevelResult>> = {};

  for (const skill of ALL_SKILLS) {
    const xp = readSkillXp(member, skill);
    const maxLevelOverride = skill === "taming" ? tamingLevelCap(member) : skill === "farming" ? farmingLevelCap(member) : undefined;
    skills[skill] = getSkillLevel(skill, xp, maxLevelOverride);
  }

  const averageLevels = SKILL_AVERAGE_SKILLS.map((skill) => skills[skill]?.level ?? 0);
  const skillAverage = averageLevels.reduce((sum, level) => sum + level, 0) / averageLevels.length;

  return { skills, skillAverage: Math.round(skillAverage * 100) / 100 };
}

export function hasSkillsApiEnabled(member: unknown): boolean {
  return getPath(member, "player_data.experience", null) !== null || getPath(member, "experience_skill_farming", null) !== null;
}
