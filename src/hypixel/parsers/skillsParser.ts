import { getSkillLevel, type LevelResult } from "../../skyblock/calculations/xpTables";
import { firstDefinedPath, getPath } from "../../utils/objectPath";

export const ALL_SKILLS = ["farming", "mining", "combat", "foraging", "fishing", "enchanting", "alchemy", "taming", "carpentry", "runecrafting", "social"] as const;
export type SkillName = (typeof ALL_SKILLS)[number];

// Skills counted toward the in-game "Skill Average" stat.
export const SKILL_AVERAGE_SKILLS: SkillName[] = ["farming", "mining", "combat", "foraging", "fishing", "enchanting", "alchemy", "taming"];

export interface ParsedSkills {
  skills: Partial<Record<SkillName, LevelResult>>;
  skillAverage: number;
}

function readSkillXp(member: unknown, skill: SkillName): number {
  const key = `SKILL_${skill.toUpperCase()}`;
  return firstDefinedPath<number>(member, [`player_data.experience.${key}`, `experience_skill_${skill}`], 0);
}

export function parseSkills(member: unknown): ParsedSkills {
  const skills: Partial<Record<SkillName, LevelResult>> = {};

  for (const skill of ALL_SKILLS) {
    const xp = readSkillXp(member, skill);
    skills[skill] = getSkillLevel(skill, xp);
  }

  const averageLevels = SKILL_AVERAGE_SKILLS.map((skill) => skills[skill]?.level ?? 0);
  const skillAverage = averageLevels.reduce((sum, level) => sum + level, 0) / averageLevels.length;

  return { skills, skillAverage: Math.round(skillAverage * 100) / 100 };
}

export function hasSkillsApiEnabled(member: unknown): boolean {
  return getPath(member, "player_data.experience", null) !== null || getPath(member, "experience_skill_farming", null) !== null;
}
