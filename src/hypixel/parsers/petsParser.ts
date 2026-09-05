import { approximatePetLevel } from "../../skyblock/calculations/petLeveling";
import { firstDefinedPath } from "../../utils/objectPath";

export interface ParsedPet {
  type: string;
  rarity: string;
  level: number;
  levelConfidence: "approximate";
  xp: number;
  active: boolean;
  heldItem: string | null;
  candyUsed: number;
}

interface RawPet {
  type?: string;
  tier?: string;
  exp?: number;
  active?: boolean;
  heldItem?: string | null;
  candyUsed?: number;
}

export function parsePets(member: unknown): ParsedPet[] {
  const rawPets = firstDefinedPath<RawPet[]>(member, ["pets_data.pets", "pets"], []);

  return rawPets
    .filter((pet) => pet.type)
    .map((pet) => {
      const rarity = pet.tier ?? "COMMON";
      const xp = pet.exp ?? 0;
      const { level } = approximatePetLevel(xp, rarity);
      return {
        type: pet.type as string,
        rarity,
        level,
        levelConfidence: "approximate" as const,
        xp,
        active: pet.active ?? false,
        heldItem: pet.heldItem ?? null,
        candyUsed: pet.candyUsed ?? 0,
      };
    });
}

export function getActivePet(member: unknown): ParsedPet | null {
  return parsePets(member).find((pet) => pet.active) ?? null;
}
