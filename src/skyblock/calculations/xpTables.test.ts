import { describe, expect, it } from "vitest";
import { getDungeonLevel, getSkillLevel } from "./xpTables";

describe("getSkillLevel", () => {
  it("returns level 0 for no XP", () => {
    const result = getSkillLevel("farming", 0);
    expect(result.level).toBe(0);
    expect(result.progressToNext).toBe(0);
  });

  it("returns level 1 once the level-1 threshold is met", () => {
    const result = getSkillLevel("farming", 50);
    expect(result.level).toBe(1);
  });

  it("caps runecrafting at level 25 even with huge XP", () => {
    const result = getSkillLevel("runecrafting", 1_000_000_000);
    expect(result.level).toBe(25);
    expect(result.xpForNextLevel).toBeNull();
  });

  it("caps foraging at level 50 (not 60)", () => {
    const result = getSkillLevel("foraging", 1_000_000_000);
    expect(result.level).toBe(50);
  });

  it("computes partial progress toward the next level", () => {
    const result = getSkillLevel("mining", 60); // level 1 needs 50, level 2 needs 125 more
    expect(result.level).toBe(1);
    expect(result.xpIntoLevel).toBe(10);
    expect(result.xpForNextLevel).toBe(125);
  });
});

describe("getDungeonLevel", () => {
  it("returns level 0 for no XP", () => {
    expect(getDungeonLevel(0).level).toBe(0);
  });

  it("reaches level 1 at 50 xp", () => {
    expect(getDungeonLevel(50).level).toBe(1);
  });

  it("respects a custom max level cap", () => {
    const result = getDungeonLevel(1_000_000_000, 10);
    expect(result.level).toBe(10);
  });
});
