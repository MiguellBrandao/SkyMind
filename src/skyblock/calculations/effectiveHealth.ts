export interface EffectiveHealthInput {
  health: number;
  defense: number;
}

export interface EffectiveHealthResult {
  effectiveHealth: number;
  damageReductionPercent: number;
}

/**
 * SkyBlock's well-known effective-health-pool formula:
 * EHP = Health * (1 + Defense / 100)
 * Damage reduction from defense = Defense / (Defense + 100).
 */
export function calculateEffectiveHealth(input: EffectiveHealthInput): EffectiveHealthResult {
  const { health, defense } = input;
  const effectiveHealth = health * (1 + Math.max(0, defense) / 100);
  const damageReductionPercent = (defense / (defense + 100)) * 100;
  return {
    effectiveHealth: Math.round(effectiveHealth),
    damageReductionPercent: Math.round(damageReductionPercent * 100) / 100,
  };
}
