import { EmbedBuilder } from "discord.js";
import type { SkyblockProfileDetail } from "../../skyblock/services/profileService";
import { COLORS } from "./colors";

const ARMOR_PIECE_SUFFIXES = [" Helmet", " Chestplate", " Leggings", " Boots", " Hat", " Cap", " Mask"];

function guessArmorSetName(armorNames: (string | null)[]): string | null {
  const named = armorNames.filter((n): n is string => !!n);
  if (named.length === 0) return null;
  const stripped = named.map((name) => {
    let base = name;
    for (const suffix of ARMOR_PIECE_SUFFIXES) {
      if (base.endsWith(suffix)) {
        base = base.slice(0, -suffix.length);
        break;
      }
    }
    return base.trim();
  });
  const counts = new Map<string, number>();
  for (const name of stripped) counts.set(name, (counts.get(name) ?? 0) + 1);
  const [mostCommon] = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return mostCommon?.[0] ?? null;
}

function findWeaponName(items: { minecraftId: number | null; lore: string[]; displayName: string | null }[]): string | null {
  const candidate = items.find((item) => item.minecraftId !== null && item.lore.some((line) => /damage/i.test(line)));
  return candidate?.displayName ?? null;
}

export function buildProfileEmbed(username: string, detail: SkyblockProfileDetail): EmbedBuilder {
  const armorSet = guessArmorSetName(detail.armor.map((a) => a.displayName));
  const weapon = findWeaponName(detail.inventory);
  const combatLevel = detail.skills.skills.combat?.level ?? 0;

  const embed = new EmbedBuilder()
    .setColor(COLORS.primary)
    .setTitle(`📊 ${username}'s SkyBlock Profile`)
    .setDescription(detail.cuteName ? `Profile: **${detail.cuteName}**${detail.gameMode && detail.gameMode !== "classic" ? ` (${detail.gameMode})` : ""}` : null)
    .addFields(
      { name: "Level", value: `${detail.skyblockLevel}`, inline: true },
      { name: "Combat", value: `${combatLevel}`, inline: true },
      { name: "Catacombs", value: `${detail.dungeons.catacombs.level}`, inline: true },
      { name: "Magical Power", value: `${detail.magicalPower}`, inline: true },
      { name: "Purse", value: `${Math.round(detail.purseCoins).toLocaleString("en-US")} coins`, inline: true },
      { name: "Bank", value: `${Math.round(detail.bankCoins).toLocaleString("en-US")} coins`, inline: true },
    )
    .addFields({
      name: "⚔️ Equipment",
      value: [`Armor: ${armorSet ?? "Not detected"}`, `Weapon: ${weapon ?? "Not detected"}`, `Pet: ${detail.activePet ? `${detail.activePet.type} (${detail.activePet.rarity})` : "None active"}`].join("\n"),
    })
    .setFooter({ text: detail.inventoryApiEnabled ? "Inventory API: enabled" : "Inventory API: disabled - some data may be incomplete" })
    .setTimestamp(detail.fetchedAt);

  return embed;
}
