import type { StringSelectMenuInteraction } from "discord.js";
import { toUserMessage } from "../../../utils/errors";
import { logger } from "../../../utils/logger";
import { buildErrorEmbed } from "../../embeds/errorEmbed";
import { editReplyWithExpiry } from "../componentExpiry";
import { buildNetworthCard } from "../networthCard";

export async function handleNetworthSelect(interaction: StringSelectMenuInteraction): Promise<void> {
  const parts = interaction.customId.split(":");
  const uuid = parts[2];
  const profileId = interaction.values[0];
  if (!uuid || !profileId) return;

  await interaction.deferUpdate();

  try {
    const message = await buildNetworthCard(uuid, profileId);
    await editReplyWithExpiry(interaction, message);
  } catch (err) {
    logger.error({ err }, "Networth select menu failed");
    await interaction.editReply({ embeds: [buildErrorEmbed(toUserMessage(err))], components: [] });
  }
}
