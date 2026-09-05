import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { editReplyWithExpiry } from "../interactions/componentExpiry";
import { buildProfileCard } from "../interactions/profileCard";
import { toUserMessage } from "../../utils/errors";
import { buildErrorEmbed } from "../embeds/errorEmbed";
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
      const message = await buildProfileCard(target.uuid, "stats", target.profileId);
      await editReplyWithExpiry(interaction, message);
    } catch (err) {
      await interaction.editReply({ embeds: [buildErrorEmbed(toUserMessage(err))] });
    }
  },
};
