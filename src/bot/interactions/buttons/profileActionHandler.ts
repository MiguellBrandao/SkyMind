import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, type ButtonBuilder, type ButtonInteraction, type StringSelectMenuBuilder } from "discord.js";
import { cacheKeys } from "../../../hypixel/cache/cacheKeys";
import { invalidateCache } from "../../../hypixel/cache/cachedFetch";
import { hypixelClient } from "../../../hypixel/client/HypixelClient";
import { profileService } from "../../../skyblock/services/profileService";
import { getProfileOverviewExtras } from "../../../skyblock/services/profileOverviewService";
import { toUserMessage } from "../../../utils/errors";
import { logger } from "../../../utils/logger";
import { buildErrorEmbed } from "../../embeds/errorEmbed";
import { buildProfileEmbed } from "../../embeds/profileEmbed";
import { buildStatsEmbed } from "../../embeds/statsEmbed";
import { buildProfileActionRow, buildProfileSelectRow } from "../components";

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
      await interaction.editReply({ embeds: [buildStatsEmbed(displayName, snapshot, uuid)], components: [buildProfileActionRow(uuid)] });
      return;
    }

    const [detail, profiles] = await Promise.all([profileService.getDetail(uuid), profileService.getProfileList(uuid)]);
    const extras = await getProfileOverviewExtras(detail);

    const components: (ActionRowBuilder<ButtonBuilder> | ActionRowBuilder<StringSelectMenuBuilder>)[] = [buildProfileActionRow(uuid)];
    if (profiles.length > 1) {
      components.push(
        buildProfileSelectRow(
          uuid,
          profiles.map((p) => ({ profileId: p.profile_id, label: p.cute_name ?? p.profile_id, selected: p.profile_id === detail.profileId })),
        ),
      );
    }

    await interaction.editReply({ embeds: [buildProfileEmbed(displayName, detail, { uuid, ...extras })], components });
  } catch (err) {
    logger.error({ err, action }, "Profile action button failed");
    await interaction.editReply({ embeds: [buildErrorEmbed(toUserMessage(err))], components: [] });
  }
}
