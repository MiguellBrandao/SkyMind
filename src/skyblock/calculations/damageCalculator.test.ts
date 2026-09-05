import { describe, expect, it } from "vitest";
import { calculateDamage } from "./damageCalculator";

describe("calculateDamage", () => {
  it("computes base hit damage with no strength/crit", () => {
    const result = calculateDamage({ weaponDamage: 100, strength: 0, critDamage: 0, critChance: 0 });
    expect(result.hitDamage).toBe(105); // 5 + 100
    expect(result.averageDamage).toBe(105);
  });

  it("applies the strength multiplier", () => {
    const result = calculateDamage({ weaponDamage: 100, strength: 100, critDamage: 0, critChance: 0 });
    // base = 5 + 100 + 100/5 = 125; multiplier = 1 + 100/100 = 2 -> 250
    expect(result.hitDamage).toBe(250);
  });

  it("blends crit and non-crit damage by crit chance", () => {
    const result = calculateDamage({ weaponDamage: 100, strength: 0, critDamage: 100, critChance: 100 });
    // Always crits: hit=105, critHit=105*2=210
    expect(result.averageDamage).toBe(210);
  });

  it("applies target defense mitigation when provided", () => {
    const result = calculateDamage({ weaponDamage: 100, strength: 0, critDamage: 0, critChance: 0, targetDefense: 100 });
    expect(result.mitigatedAverageDamage).toBe(Math.round(105 * (100 / 200) * 100) / 100);
  });

  it("omits mitigation when no target defense is given", () => {
    const result = calculateDamage({ weaponDamage: 100, strength: 0, critDamage: 0, critChance: 0 });
    expect(result.mitigatedAverageDamage).toBeNull();
  });
});
