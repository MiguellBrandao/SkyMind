import { computeCategoryScores, type CategoryScores } from "../calculations";
import { calculateNetWorth } from "./networthService";
import type { SkyblockProfileDetail } from "./profileService";

export interface AnalysisFinding {
  title: string;
  detail: string;
  severity: "high" | "medium" | "low";
}

export interface ProfileAnalysis {
  scores: CategoryScores;
  skyblockLevel: number;
  skillAverage: number;
  catacombsLevel: number;
  magicalPower: number;
  estimatedNetWorth: number;
  netWorthIncomplete: boolean;
  bottlenecks: AnalysisFinding[];
  upgrades: AnalysisFinding[];
}

const RARITY_SCORE: Record<string, number> = {
  COMMON: 10,
  UNCOMMON: 25,
  RARE: 45,
  EPIC: 65,
  LEGENDARY: 85,
  MYTHIC: 100,
};

function averageRarityScore(rarities: (string | null)[]): number {
  const scored = rarities.filter((r): r is string => !!r).map((r) => RARITY_SCORE[r.toUpperCase()] ?? 0);
  if (scored.length === 0) return 0;
  return scored.reduce((a, b) => a + b, 0) / scored.length;
}

/**
 * Deterministic, rule-based profile analysis: scoring + bottleneck/upgrade *directions*.
 * Deliberately does not fabricate specific item recommendations or prices beyond what can
 * be resolved from live market data - nuanced "buy X instead of Y" advice belongs to the AI
 * agent (analyze_profile tool), which can combine this output with search_skyblock_knowledge.
 */
export async function analyzeProfile(profile: SkyblockProfileDetail): Promise<ProfileAnalysis> {
  const armorRarities = profile.armor.map((item) => item.rarity);
  const equippedArmorCount = profile.armor.filter((item) => item.minecraftId !== null).length;
  const weapon = findLikelyWeapon(profile.inventory);

  const netWorth = await calculateNetWorth(profile);

  const scores = computeCategoryScores({
    combatSkillLevel: profile.skills.skills.combat?.level ?? 0,
    slayerLevels: profile.slayers.map((s) => s.level),
    catacombsLevel: profile.dungeons.catacombs.level,
    classAverageLevel: profile.dungeons.classAverage,
    magicalPower: profile.magicalPower,
    activePetLevel: profile.activePet?.level ?? null,
    activePetRarity: profile.activePet?.rarity ?? null,
    equipmentRarities: [...armorRarities, weapon?.rarity ?? null].filter((r): r is string => !!r),
    estimatedNetWorth: netWorth.networth,
    skyblockLevel: profile.skyblockLevel,
    skillAverage: profile.skills.skillAverage,
  });

  const bottlenecks: AnalysisFinding[] = [];
  const upgrades: AnalysisFinding[] = [];

  const combatLevel = profile.skills.skills.combat?.level ?? 0;
  if (combatLevel < profile.dungeons.catacombs.level - 5) {
    bottlenecks.push({
      title: "Combat skill lagging behind Catacombs",
      detail: `Combat is level ${combatLevel} but Catacombs is level ${profile.dungeons.catacombs.level}. Combat XP boosts your health/strength and is usually cheap to catch up via Slayers or grinding mobs.`,
      severity: "medium",
    });
  }

  if (profile.magicalPower < 200 && profile.skyblockLevel > 100) {
    bottlenecks.push({
      title: "Low magical power for this progression stage",
      detail: `Magical power is ${profile.magicalPower}, which is low for a SkyBlock level ${profile.skyblockLevel} account. More/higher-rarity accessories meaningfully raise stats via the Accessory Bag power bonus.`,
      severity: "high",
    });
    upgrades.push({
      title: "Upgrade accessory rarities or add missing accessories",
      detail: "Reforging accessories to a higher rarity (e.g. via Recombobulator 3000) or filling empty accessory bag slots raises magical power directly.",
      severity: "high",
    });
  }

  if (!profile.activePet) {
    bottlenecks.push({
      title: "No active pet equipped",
      detail: "An active pet provides passive combat/skill/economy bonuses for free. Equip your highest-rarity leveled pet.",
      severity: "medium",
    });
  } else if (["COMMON", "UNCOMMON"].includes(profile.activePet.rarity.toUpperCase()) && profile.skyblockLevel > 50) {
    upgrades.push({
      title: `Upgrade your active pet's rarity (currently ${profile.activePet.rarity})`,
      detail: "Pet Skins/Pet items aside, using a Legendary+ pet of the same type (if affordable) or leveling further gives a large stat jump for the same pet slot.",
      severity: "medium",
    });
  }

  if (equippedArmorCount < 4) {
    bottlenecks.push({
      title: "Incomplete armor set",
      detail: `Only ${equippedArmorCount}/4 armor slots are filled. A full matching set often grants a set bonus on top of raw stats.`,
      severity: "high",
    });
  } else {
    const avgArmorRarity = averageRarityScore(armorRarities);
    if (avgArmorRarity < 45 && profile.dungeons.catacombs.level > 10) {
      upgrades.push({
        title: "Armor rarity is behind your Catacombs progress",
        detail: "Your average armor rarity is low relative to your dungeon level. Reforging or upgrading to a higher-rarity armor set (e.g. via Recombobulator 3000 / Necron's Handle-style upgrades) will noticeably raise EHP and damage.",
        severity: "medium",
      });
    }
  }

  if (!weapon) {
    bottlenecks.push({
      title: "No clear primary weapon detected",
      detail: "Couldn't identify a weapon with a Damage stat in your main inventory. Make sure a sword/bow/etc. is in your hotbar or inventory (not just the ender chest).",
      severity: "low",
    });
  }

  if (profile.slayers.every((s) => s.level < 5) && combatLevel > 20) {
    bottlenecks.push({
      title: "Slayers underdeveloped",
      detail: "All slayer levels are below 5 despite meaningful Combat skill progress. Slayer levels unlock strong armor/weapon recipes and passive stat boosts.",
      severity: "low",
    });
  }

  const idleCoins = profile.purseCoins + profile.bankCoins;
  if (idleCoins > 10_000_000) {
    upgrades.push({
      title: "Large idle coin balance",
      detail: `You're holding ~${Math.round(idleCoins / 1_000_000)}M coins in purse/bank. Consider investing in gear upgrades, bazaar flips, or Auction House BINs that match your current bottlenecks.`,
      severity: "low",
    });
  }

  return {
    scores,
    skyblockLevel: profile.skyblockLevel,
    skillAverage: profile.skills.skillAverage,
    catacombsLevel: profile.dungeons.catacombs.level,
    magicalPower: profile.magicalPower,
    estimatedNetWorth: netWorth.networth,
    netWorthIncomplete: netWorth.incomplete,
    bottlenecks: bottlenecks.slice(0, 5),
    upgrades: upgrades.slice(0, 5),
  };
}

function findLikelyWeapon(items: { minecraftId: number | null; lore: string[]; rarity: string | null; displayName: string | null }[]) {
  const candidates = items.filter((item) => item.minecraftId !== null && item.lore.some((line) => /damage/i.test(line)));
  if (candidates.length === 0) return null;
  return candidates.sort((a, b) => (RARITY_SCORE[b.rarity?.toUpperCase() ?? ""] ?? 0) - (RARITY_SCORE[a.rarity?.toUpperCase() ?? ""] ?? 0))[0] ?? null;
}
