export interface DamageInput {
  weaponDamage: number;
  strength: number;
  critDamage: number;
  critChance: number;
  /** Optional target defense, applied via the standard SkyBlock mitigation formula. */
  targetDefense?: number;
}

export interface DamageResult {
  hitDamage: number;
  critDamage: number;
  averageDamage: number;
  mitigatedAverageDamage: number | null;
}

/**
 * Standard SkyBlock hit-damage formula:
 * Damage = (5 + WeaponDamage + Strength/5) * (1 + Strength/100) * (1 + CritDamage/100 on crit hits)
 * Mob damage mitigation from defense: effectiveDamage = damage * 100 / (100 + defense)
 */
export function calculateDamage(input: DamageInput): DamageResult {
  const { weaponDamage, strength, critDamage, critChance, targetDefense } = input;

  const base = 5 + weaponDamage + strength / 5;
  const strengthMultiplier = 1 + strength / 100;

  const hitDamage = base * strengthMultiplier;
  const critHitDamage = hitDamage * (1 + critDamage / 100);

  const clampedCritChance = Math.min(1, Math.max(0, critChance / 100));
  const averageDamage = hitDamage * (1 - clampedCritChance) + critHitDamage * clampedCritChance;

  const mitigatedAverageDamage = targetDefense !== undefined ? averageDamage * (100 / (100 + Math.max(0, targetDefense))) : null;

  return {
    hitDamage: Math.round(hitDamage * 100) / 100,
    critDamage: Math.round(critHitDamage * 100) / 100,
    averageDamage: Math.round(averageDamage * 100) / 100,
    mitigatedAverageDamage: mitigatedAverageDamage !== null ? Math.round(mitigatedAverageDamage * 100) / 100 : null,
  };
}
