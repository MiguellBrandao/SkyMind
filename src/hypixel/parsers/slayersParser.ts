import { getPath } from "../../utils/objectPath";

export const SLAYER_BOSSES = ["zombie", "spider", "wolf", "enderman", "blaze", "vampire"] as const;
export type SlayerBoss = (typeof SLAYER_BOSSES)[number];

export interface ParsedSlayer {
  boss: SlayerBoss;
  xp: number;
  level: number;
}

/**
 * Slayer level is derived from the count of sequentially-claimed reward tiers rather than an
 * XP table, since claims must be made in order - this is exact, not an approximation.
 */
export function parseSlayers(member: unknown): ParsedSlayer[] {
  return SLAYER_BOSSES.map((boss) => {
    const xp = getPath<number>(member, `slayer.slayer_bosses.${boss}.xp`, 0);
    const claimedLevels = getPath<Record<string, boolean>>(member, `slayer.slayer_bosses.${boss}.claimed_levels`, {});
    const level = Object.values(claimedLevels).filter(Boolean).length;
    return { boss, xp, level };
  }).filter((s) => s.xp > 0 || s.level > 0);
}
