import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { profileService } from "../../skyblock/services/profileService";
import { toUserMessage } from "../../utils/errors";
import { buildErrorEmbed } from "../embeds/errorEmbed";
import { buildStatsEmbed } from "../embeds/statsEmbed";
import { buildProfileActionRow } from "../interactions/components";
import { resolveCommandTarget } from "./resolveCommandTarget";
import type { SlashCommand } from "./types";

export const statsCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("View detailed skill, dungeon, and slayer stats for a SkyBlock profile")
    .addStringOption((opt) => opt.setName("ign").setDescription("Minecraft username (defaults to your linked account)").setMaxLength(16)),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    try {
      const target = await resolveCommandTarget(interaction);
      const snapshot = await profileService.getSnapshot(target.uuid, target.profileId);
      await interaction.editReply({ embeds: [buildStatsEmbed(target.username, snapshot, target.uuid)], components: [buildProfileActionRow(target.uuid)] });
    } catch (err) {
      await interaction.editReply({ embeds: [buildErrorEmbed(toUserMessage(err))] });
    }
  },
};
