import { ActionRowBuilder, type ButtonBuilder, type StringSelectMenuBuilder, type StringSelectMenuInteraction } from "discord.js";
import { hypixelClient } from "../../../hypixel/client/HypixelClient";
import { profileService } from "../../../skyblock/services/profileService";
import { getProfileOverviewExtras } from "../../../skyblock/services/profileOverviewService";
import { toUserMessage } from "../../../utils/errors";
import { logger } from "../../../utils/logger";
import { buildErrorEmbed } from "../../embeds/errorEmbed";
import { buildProfileEmbed } from "../../embeds/profileEmbed";
import { buildProfileActionRow, buildProfileSelectRow } from "../components";

/** Re-renders the /profile card for a different SkyBlock profile the player owns, without re-running the command. */
export async function handleProfileSelect(interaction: StringSelectMenuInteraction): Promise<void> {
  const uuid = interaction.customId.split(":")[2];
  const profileId = interaction.values[0];
  if (!uuid || !profileId) return;

  await interaction.deferUpdate();

  try {
    const [player, detail, profiles] = await Promise.all([hypixelClient.getPlayer(uuid), profileService.getDetail(uuid, profileId), profileService.getProfileList(uuid)]);
    const extras = await getProfileOverviewExtras(detail);
    const displayName = player.displayname ?? uuid;

    const components: (ActionRowBuilder<ButtonBuilder> | ActionRowBuilder<StringSelectMenuBuilder>)[] = [buildProfileActionRow(uuid)];
    if (profiles.length > 1) {
      components.push(
        buildProfileSelectRow(
          uuid,
          profiles.map((p) => ({ profileId: p.profile_id, label: p.cute_name ?? p.profile_id, selected: p.profile_id === profileId })),
        ),
      );
    }

    await interaction.editReply({ embeds: [buildProfileEmbed(displayName, detail, { uuid, ...extras })], components });
  } catch (err) {
    logger.error({ err }, "Profile select menu failed");
    await interaction.editReply({ embeds: [buildErrorEmbed(toUserMessage(err))], components: [] });
  }
}
