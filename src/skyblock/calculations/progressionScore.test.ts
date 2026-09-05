import { describe, expect, it } from "vitest";
import { computeCategoryScores, type ProgressionMetrics } from "./progressionScore";

const baseMetrics: ProgressionMetrics = {
  combatSkillLevel: 0,
  slayerLevels: [],
  catacombsLevel: 0,
  classAverageLevel: 0,
  magicalPower: 0,
  activePetLevel: null,
  activePetRarity: null,
  equipmentRarities: [],
  estimatedNetWorth: 0,
  skyblockLevel: 0,
  skillAverage: 0,
};

describe("computeCategoryScores", () => {
  it("scores an empty/new profile at or near zero everywhere", () => {
    const scores = computeCategoryScores(baseMetrics);
    expect(scores.combat).toBe(0);
    expect(scores.dungeons).toBe(0);
    expect(scores.accessories).toBe(0);
    expect(scores.pets).toBe(0);
    expect(scores.equipment).toBe(0);
    expect(scores.overall).toBe(0);
  });

  it("never exceeds 100 in any category even with extreme stats", () => {
    const scores = computeCategoryScores({
      combatSkillLevel: 999,
      slayerLevels: [999, 999],
      catacombsLevel: 999,
      classAverageLevel: 999,
      magicalPower: 999_999,
      activePetLevel: 999,
      activePetRarity: "MYTHIC",
      equipmentRarities: ["MYTHIC", "MYTHIC", "MYTHIC", "MYTHIC"],
      estimatedNetWorth: 1_000_000_000_000,
      skyblockLevel: 999,
      skillAverage: 999,
    });
    for (const value of Object.values(scores)) {
      expect(value).toBeLessThanOrEqual(100);
    }
  });

  it("gives a maxed combat skill a higher combat score than a fresh one", () => {
    const low = computeCategoryScores({ ...baseMetrics, combatSkillLevel: 5 });
    const high = computeCategoryScores({ ...baseMetrics, combatSkillLevel: 60 });
    expect(high.combat).toBeGreaterThan(low.combat);
  });
});
