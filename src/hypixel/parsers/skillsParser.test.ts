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
