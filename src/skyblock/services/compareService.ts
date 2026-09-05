import type { CategoryScores } from "../calculations";
import { analyzeProfile } from "./profileAnalyzer";
import type { SkyblockProfileDetail } from "./profileService";

export interface ComparisonSide {
  label: string;
  skyblockLevel: number;
  skillAverage: number;
  catacombsLevel: number;
  magicalPower: number;
  estimatedNetWorth: number;
  scores: CategoryScores;
}

export interface ProfileComparison {
  a: ComparisonSide;
  b: ComparisonSide;
  leaderPerCategory: Record<keyof CategoryScores, "a" | "b" | "tie">;
}

export async function compareProfiles(a: { label: string; profile: SkyblockProfileDetail }, b: { label: string; profile: SkyblockProfileDetail }): Promise<ProfileComparison> {
  const [analysisA, analysisB] = await Promise.all([analyzeProfile(a.profile), analyzeProfile(b.profile)]);

  const sideA: ComparisonSide = {
    label: a.label,
    skyblockLevel: analysisA.skyblockLevel,
    skillAverage: analysisA.skillAverage,
    catacombsLevel: analysisA.catacombsLevel,
    magicalPower: analysisA.magicalPower,
    estimatedNetWorth: analysisA.estimatedNetWorth,
    scores: analysisA.scores,
  };
  const sideB: ComparisonSide = {
    label: b.label,
    skyblockLevel: analysisB.skyblockLevel,
    skillAverage: analysisB.skillAverage,
    catacombsLevel: analysisB.catacombsLevel,
    magicalPower: analysisB.magicalPower,
    estimatedNetWorth: analysisB.estimatedNetWorth,
    scores: analysisB.scores,
  };

  const categories = Object.keys(sideA.scores) as (keyof CategoryScores)[];
  const leaderPerCategory = Object.fromEntries(
    categories.map((category) => {
      const diff = sideA.scores[category] - sideB.scores[category];
      return [category, Math.abs(diff) < 0.5 ? "tie" : diff > 0 ? "a" : "b"];
    }),
  ) as Record<keyof CategoryScores, "a" | "b" | "tie">;

  return { a: sideA, b: sideB, leaderPerCategory };
}
