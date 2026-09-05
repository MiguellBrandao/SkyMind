import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, type ButtonInteraction } from "discord.js";
import { cacheKeys } from "../../../hypixel/cache/cacheKeys";
import { invalidateCache } from "../../../hypixel/cache/cachedFetch";
import { hypixelClient } from "../../../hypixel/client/HypixelClient";
import { marketService } from "../../../skyblock/services/marketService";
import { analyzeProfile } from "../../../skyblock/services/profileAnalyzer";
import { profileService } from "../../../skyblock/services/profileService";
import { toUserMessage } from "../../../utils/errors";
import { logger } from "../../../utils/logger";
import { buildAnalyzeEmbed } from "../../embeds/analyzeEmbed";
import { buildErrorEmbed } from "../../embeds/errorEmbed";
import { buildProfileEmbed } from "../../embeds/profileEmbed";
import { buildStatsEmbed } from "../../embeds/statsEmbed";
import { buildProfileActionRow } from "../components";

export async function handleProfileAction(interaction: ButtonInteraction): Promise<void> {
  const parts = interaction.customId.split(":");
  const action = parts[1];
  const uuid = parts[2];
  if (!uuid) return;

  if (action === "ask") {
    const modal = new ModalBuilder().setCustomId(`profile:ask-modal:${uuid}`).setTitle("Ask SkyMind AI");
    const input = new TextInputBuilder().setCustomId("question").setLabel("What do you want to ask?").setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(500);
    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
    await interaction.showModal(modal);
    return;
  }

  await interaction.deferUpdate();

  try {
    if (action === "refresh") {
      await Promise.all([invalidateCache(cacheKeys.player(uuid)), invalidateCache(cacheKeys.profiles(uuid))]);
    }

    const player = await hypixelClient.getPlayer(uuid);
    const displayName = player.displayname ?? uuid;

    if (action === "stats") {
      const snapshot = await profileService.getSnapshot(uuid);
      await interaction.editReply({ embeds: [buildStatsEmbed(displayName, snapshot)], components: [buildProfileActionRow(uuid)] });
      return;
    }

    if (action === "analyze") {
      const detail = await profileService.getDetail(uuid);
      const bazaar = await hypixelClient.getBazaar();
      const priceLookup = marketService.buildBazaarPriceLookup(bazaar.products ?? {});
      const analysis = analyzeProfile(detail, priceLookup);
      await interaction.editReply({ embeds: [buildAnalyzeEmbed(displayName, analysis)], components: [buildProfileActionRow(uuid)] });
      return;
    }

    const detail = await profileService.getDetail(uuid);
    await interaction.editReply({ embeds: [buildProfileEmbed(displayName, detail)], components: [buildProfileActionRow(uuid)] });
  } catch (err) {
    logger.error({ err, action }, "Profile action button failed");
    await interaction.editReply({ embeds: [buildErrorEmbed(toUserMessage(err))], components: [] });
  }
}
