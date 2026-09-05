import { EmbedBuilder } from "discord.js";
import type { ParsedSlayer } from "../../hypixel/parsers/slayersParser";
import type { SkyblockProfileDetail } from "../../skyblock/services/profileService";
import { COLORS } from "./colors";
import { SLAYER_ICON, SLAYER_ORDER, STAT_ICON } from "./icons";
import { getProfileEmoji } from "./profileNameEmoji";
import { getSkinAvatarUrl } from "./skinRender";

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

function formatCoins(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
  return Math.round(amount).toLocaleString("en-US");
}

function formatSlayers(slayers: ParsedSlayer[]): string {
  const byBoss = new Map(slayers.map((s) => [s.boss, s.level]));
  return SLAYER_ORDER.map((boss) => `${SLAYER_ICON[boss]}${byBoss.get(boss) ?? 0}`).join("  ");
}

export interface ProfileEmbedExtras {
  uuid: string;
  estimatedNetWorth: number;
  netWorthIncomplete: boolean;
  collectionsSummary: { maxed: number; total: number } | null;
}

export const CREDIT_LINE = "🔧 by [Miguelllb](https://github.com/MiguellBrandao)";

export function buildProfileEmbed(username: string, detail: SkyblockProfileDetail, extras: ProfileEmbedExtras): EmbedBuilder {
  const armorSet = guessArmorSetName(detail.armor.map((a) => a.displayName));
  const weapon = findWeaponName(detail.inventory);
  const profileEmoji = getProfileEmoji(detail.cuteName);
  const netWorthNote = extras.netWorthIncomplete ? " (Inventory API off - understated)" : "";

  const embed = new EmbedBuilder()
    .setColor(COLORS.primary)
    .setAuthor({ name: `${username}'s SkyBlock Profile`, iconURL: getSkinAvatarUrl(extras.uuid) })
    .setThumbnail(getSkinAvatarUrl(extras.uuid))
    .setTitle(detail.cuteName ? `${profileEmoji} ${detail.cuteName}${detail.gameMode && detail.gameMode !== "classic" ? ` (${detail.gameMode})` : ""}` : null)
    .addFields(
      { name: `${STAT_ICON.skyblockLevel} SkyBlock Level`, value: `${detail.skyblockLevel}`, inline: true },
      { name: `${STAT_ICON.skillAverage} Skill Average`, value: `${detail.skills.skillAverage}`, inline: true },
      { name: `${STAT_ICON.catacombs} Catacombs`, value: `${detail.dungeons.catacombs.level}`, inline: true },
      { name: `${STAT_ICON.magicalPower} Magical Power`, value: `${detail.magicalPower}`, inline: true },
      { name: `${STAT_ICON.purse} Purse`, value: `${formatCoins(detail.purseCoins)} coins`, inline: true },
      { name: `${STAT_ICON.bank} Bank`, value: `${formatCoins(detail.bankCoins)} coins`, inline: true },
      { name: `${STAT_ICON.networth} Net Worth`, value: `${formatCoins(extras.estimatedNetWorth)} coins${netWorthNote}`, inline: true },
      { name: "🗡️ Slayers", value: detail.slayers.length > 0 ? formatSlayers(detail.slayers) : "No slayer progress yet", inline: true },
      ...(extras.collectionsSummary
        ? [{ name: `${STAT_ICON.collections} Collections Maxed`, value: `${extras.collectionsSummary.maxed}/${extras.collectionsSummary.total}`, inline: true }]
        : []),
    )
    .addFields({
      name: `${STAT_ICON.equipment} Equipment`,
      value: [`Armor: ${armorSet ?? "Not detected"}`, `Weapon: ${weapon ?? "Not detected"}`, `Pet: ${detail.activePet ? `${detail.activePet.type} (${detail.activePet.rarity})` : "None active"}`].join("\n"),
    });

  if (!detail.inventoryApiEnabled) {
    embed.addFields({ name: "⚠️ Inventory API disabled", value: "Armor/weapon/pet/accessories/net worth may be incomplete for this player." });
  }

  embed.addFields({ name: "​", value: CREDIT_LINE });
  embed.setTimestamp(detail.fetchedAt);

  return embed;
}
