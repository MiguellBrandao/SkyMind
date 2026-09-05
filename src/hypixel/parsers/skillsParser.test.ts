import { describe, expect, it } from "vitest";
import { parseSkills } from "./skillsParser";

describe("parseSkills", () => {
  it("reads XP from the current nested player_data.experience path", () => {
    const member = { player_data: { experience: { SKILL_FARMING: 50 } } };
    const result = parseSkills(member);
    expect(result.skills.farming?.level).toBe(1);
  });

  it("falls back to the legacy flat experience_skill_* path", () => {
    const member = { experience_skill_mining: 50 };
    const result = parseSkills(member);
    expect(result.skills.mining?.level).toBe(1);
  });

  it("defaults to 0 XP / level 0 for a skill with no data", () => {
    const result = parseSkills({});
    expect(result.skills.alchemy?.level).toBe(0);
  });

  it("caps Taming at 50 when the player hasn't sacrificed any pets to George", () => {
    // Enough XP for level 60, but the cap should hold it at 50 with no sacrifices recorded.
    const member = { player_data: { experience: { SKILL_TAMING: 100_000_000 } } };
    const result = parseSkills(member);
    expect(result.skills.taming?.level).toBe(50);
  });

  it("raises the Taming cap by 1 per unique pet type sacrificed to George", () => {
    const member = {
      player_data: { experience: { SKILL_TAMING: 100_000_000 } },
      pets_data: { pet_care: { pet_types_sacrificed: ["SLUG", "GIRAFFE", "SLUG"] } }, // duplicate shouldn't double-count
    };
    const result = parseSkills(member);
    expect(result.skills.taming?.level).toBe(52); // 50 base + 2 unique types
  });

  it("never raises the Taming cap above 60 even with more than 10 sacrifices", () => {
    const member = {
      player_data: { experience: { SKILL_TAMING: 1_000_000_000 } },
      pets_data: { pet_care: { pet_types_sacrificed: Array.from({ length: 20 }, (_, i) => `PET_${i}`) } },
    };
    const result = parseSkills(member);
    expect(result.skills.taming?.level).toBe(60);
  });

  it("caps Farming at 50 by default and raises it via jacob2.perks.farming_level_cap", () => {
    const uncapped = parseSkills({ player_data: { experience: { SKILL_FARMING: 100_000_000 } } });
    expect(uncapped.skills.farming?.level).toBe(50);

    const withCapUpgrade = parseSkills({
      player_data: { experience: { SKILL_FARMING: 100_000_000 } },
      jacob2: { perks: { farming_level_cap: 5 } },
    });
    expect(withCapUpgrade.skills.farming?.level).toBe(55);
  });

  it("computes skill average only from the 8 counted skills", () => {
    const member = {
      player_data: {
        experience: {
          SKILL_FARMING: 50, // level 1
          SKILL_RUNECRAFTING: 1_000_000_000, // excluded from average, would skew it hugely
        },
      },
    };
    const result = parseSkills(member);
    // 1 level out of 8 counted skills = 0.125, rounded to 2dp (half-away-from-zero) = 0.13
    expect(result.skillAverage).toBe(0.13);
  });
});
