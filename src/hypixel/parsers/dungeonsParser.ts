import { getDungeonLevel, type LevelResult } from "../../skyblock/calculations/xpTables";
import { getPath } from "../../utils/objectPath";

export const DUNGEON_CLASSES = ["healer", "mage", "berserk", "archer", "tank"] as const;
export type DungeonClass = (typeof DUNGEON_CLASSES)[number];

export interface ParsedDungeons {
  catacombs: LevelResult;
  masterCatacombs: LevelResult | null;
  classes: Record<DungeonClass, LevelResult>;
  selectedClass: DungeonClass | null;
  classAverage: number;
  secretsFound: number;
}

export function parseDungeons(member: unknown): ParsedDungeons {
  const catacombsXp = getPath<number>(member, "dungeons.dungeon_types.catacombs.experience", 0);
  const catacombs = getDungeonLevel(catacombsXp);

  const masterXp = getPath<number | null>(member, "dungeons.dungeon_types.master_catacombs.experience", null);
  const masterCatacombs = masterXp !== null ? getDungeonLevel(masterXp) : null;

  const classes = Object.fromEntries(
    DUNGEON_CLASSES.map((cls) => {
      const xp = getPath<number>(member, `dungeons.player_classes.${cls}.experience`, 0);
      return [cls, getDungeonLevel(xp)];
    }),
  ) as Record<DungeonClass, LevelResult>;

  const selectedClass = getPath<DungeonClass | null>(member, "dungeons.selected_dungeon_class", null);
  const classAverage = DUNGEON_CLASSES.reduce((sum, cls) => sum + classes[cls].level, 0) / DUNGEON_CLASSES.length;

  const secretsFound = getPath<number>(member, "dungeons.secrets_found", 0) || getPath<number>(member, "player_stats.dungeons.secrets_found", 0);

  return {
    catacombs,
    masterCatacombs,
    classes,
    selectedClass,
    classAverage: Math.round(classAverage * 100) / 100,
    secretsFound,
  };
}

export function hasDungeonsUnlocked(member: unknown): boolean {
  return getPath(member, "dungeons.dungeon_types.catacombs", null) !== null;
}
