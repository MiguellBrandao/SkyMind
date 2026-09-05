import { EmbedBuilder } from "discord.js";
import type { DetailedNetworthResult } from "../../skyblock/services/networthService";
import { COLORS } from "./colors";
import { STAT_ICON } from "./icons";
import { CREDIT_LINE } from "./profileEmbed";
import { getSkinAvatarUrl } from "./skinRender";

function formatCoins(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
  return Math.round(amount).toLocaleString("en-US");
}

export function buildNetworthEmbed(username: string, uuid: string, profileName: string | null, result: DetailedNetworthResult): EmbedBuilder {
  const breakdown =
    result.categories.length > 0
      ? result.categories
          .slice(0, 12)
          .map((c) => `**${c.label}**: ${formatCoins(c.total)} coins`)
          .join("\n")
      : "No priced items found.";

  const embed = new EmbedBuilder()
    .setColor(COLORS.primary)
    .setAuthor({ name: `${username}'s Net Worth${profileName ? ` (${profileName})` : ""}`, iconURL: getSkinAvatarUrl(uuid) })
    .setThumbnail(getSkinAvatarUrl(uuid))
    .addFields(
      { name: `${STAT_ICON.networth} Total Net Worth`, value: `${formatCoins(result.networth)} coins`, inline: true },
      { name: "🔓 Unsoulbound Net Worth", value: `${formatCoins(result.unsoulboundNetworth)} coins`, inline: true },
      { name: `${STAT_ICON.purse} Purse`, value: `${formatCoins(result.purse)} coins`, inline: true },
      { name: `${STAT_ICON.bank} Bank`, value: `${formatCoins(result.bank)} coins`, inline: true },
      { name: "📊 Breakdown by Category", value: breakdown },
    );

  if (result.incomplete) {
    embed.addFields({ name: "⚠️ Inventory API disabled", value: "This figure is understated - only coins are guaranteed accurate." });
  }

  embed.addFields({ name: "​", value: CREDIT_LINE });
  embed.setFooter({ text: "Calculated via skyhelper-networth (bazaar + lowest BIN + museum pricing)" });
  embed.setTimestamp();

  return embed;
}
