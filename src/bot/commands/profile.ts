import { ActionRowBuilder, SlashCommandBuilder, type ButtonBuilder, type ChatInputCommandInteraction, type StringSelectMenuBuilder } from "discord.js";
import { profileService } from "../../skyblock/services/profileService";
import { getProfileOverviewExtras } from "../../skyblock/services/profileOverviewService";
import { toUserMessage } from "../../utils/errors";
import { buildErrorEmbed } from "../embeds/errorEmbed";
import { buildProfileEmbed } from "../embeds/profileEmbed";
import { buildProfileActionRow, buildProfileSelectRow } from "../interactions/components";
import { resolveCommandTarget } from "./resolveCommandTarget";
import type { SlashCommand } from "./types";

export const profileCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("View a SkyBlock profile overview")
    .addStringOption((opt) => opt.setName("ign").setDescription("Minecraft username (defaults to your linked account)").setMaxLength(16)),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    try {
      const target = await resolveCommandTarget(interaction);
      const [detail, profiles] = await Promise.all([profileService.getDetail(target.uuid, target.profileId), profileService.getProfileList(target.uuid)]);
      const extras = await getProfileOverviewExtras(detail);

      const components: (ActionRowBuilder<ButtonBuilder> | ActionRowBuilder<StringSelectMenuBuilder>)[] = [buildProfileActionRow(target.uuid)];
      if (profiles.length > 1) {
        components.push(
          buildProfileSelectRow(
            target.uuid,
            profiles.map((p) => ({ profileId: p.profile_id, label: p.cute_name ?? p.profile_id, selected: p.profile_id === detail.profileId })),
          ),
        );
      }

      await interaction.editReply({
        embeds: [buildProfileEmbed(target.username, detail, { uuid: target.uuid, ...extras })],
        components,
      });
    } catch (err) {
      await interaction.editReply({ embeds: [buildErrorEmbed(toUserMessage(err))] });
    }
  },
};
