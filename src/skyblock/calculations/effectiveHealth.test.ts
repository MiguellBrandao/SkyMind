import { describe, expect, it } from "vitest";
import { calculateEffectiveHealth } from "./effectiveHealth";

describe("calculateEffectiveHealth", () => {
  it("returns raw health when defense is 0", () => {
    const result = calculateEffectiveHealth({ health: 1000, defense: 0 });
    expect(result.effectiveHealth).toBe(1000);
    expect(result.damageReductionPercent).toBe(0);
  });

  it("doubles effective health at 100 defense", () => {
    const result = calculateEffectiveHealth({ health: 1000, defense: 100 });
    expect(result.effectiveHealth).toBe(2000);
    expect(result.damageReductionPercent).toBe(50);
  });

  it("clamps negative defense to 0 reduction", () => {
    const result = calculateEffectiveHealth({ health: 500, defense: -50 });
    expect(result.effectiveHealth).toBe(500);
  });
});
