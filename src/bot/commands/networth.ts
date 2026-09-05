import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { toUserMessage } from "../../utils/errors";
import { buildErrorEmbed } from "../embeds/errorEmbed";
import { editReplyWithExpiry } from "../interactions/componentExpiry";
import { buildNetworthCard } from "../interactions/networthCard";
import { resolveCommandTarget } from "./resolveCommandTarget";
import type { SlashCommand } from "./types";

export const networthCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("networth")
    .setDescription("See a detailed breakdown of a player's SkyBlock net worth")
    .addStringOption((opt) => opt.setName("ign").setDescription("Minecraft username (defaults to your linked account)").setMaxLength(16)),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    try {
      const target = await resolveCommandTarget(interaction);
      const message = await buildNetworthCard(target.uuid, target.profileId);
      await editReplyWithExpiry(interaction, message);
    } catch (err) {
      await interaction.editReply({ embeds: [buildErrorEmbed(toUserMessage(err))] });
    }
  },
};
