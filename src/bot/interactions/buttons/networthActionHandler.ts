import type { ButtonInteraction } from "discord.js";
import { cacheKeys } from "../../../hypixel/cache/cacheKeys";
import { invalidateCache } from "../../../hypixel/cache/cachedFetch";
import { toUserMessage } from "../../../utils/errors";
import { logger } from "../../../utils/logger";
import { buildErrorEmbed } from "../../embeds/errorEmbed";
import { editReplyWithExpiry } from "../componentExpiry";
import { buildNetworthCard } from "../networthCard";

export async function handleNetworthAction(interaction: ButtonInteraction): Promise<void> {
  const parts = interaction.customId.split(":");
  const uuid = parts[2];
  const profileId = parts[3];
  if (!uuid) return;

  await interaction.deferUpdate();

  try {
    await Promise.all([invalidateCache(cacheKeys.player(uuid)), invalidateCache(cacheKeys.profiles(uuid))]);
    const message = await buildNetworthCard(uuid, profileId);
    await editReplyWithExpiry(interaction, message);
  } catch (err) {
    logger.error({ err }, "Networth refresh failed");
    await interaction.editReply({ embeds: [buildErrorEmbed(toUserMessage(err))], components: [] });
  }
}
