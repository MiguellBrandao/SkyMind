const MINECRAFT_COLOR_CODE = /§[0-9a-fk-or]/gi;

export function stripColorCodes(text: string): string {
  return text.replace(MINECRAFT_COLOR_CODE, "");
}

const RARITY_PATTERN = /(SPECIAL|VERY SPECIAL|COMMON|UNCOMMON|RARE|EPIC|LEGENDARY|MYTHIC|DIVINE|ADMIN)/i;

/** Best-effort rarity extraction from an item's lore (rarity is conventionally the last non-empty lore line). */
export function extractRarityFromLore(lore: string[]): string | null {
  for (let i = lore.length - 1; i >= 0; i--) {
    const line = stripColorCodes(lore[i] ?? "").trim();
    if (!line) continue;
    const match = RARITY_PATTERN.exec(line);
    if (match) return match[1]?.toUpperCase() ?? null;
    break;
  }
  return null;
}
