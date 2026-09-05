import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { profileService } from "../../skyblock/services/profileService";
import { getProfileOverviewExtras } from "../../skyblock/services/profileOverviewService";
import { toUserMessage } from "../../utils/errors";
import { buildErrorEmbed } from "../embeds/errorEmbed";
import { buildProfileEmbed } from "../embeds/profileEmbed";
import { buildProfileActionRow } from "../interactions/components";
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
      const detail = await profileService.getDetail(target.uuid);
      const extras = await getProfileOverviewExtras(detail);
      await interaction.editReply({
        embeds: [buildProfileEmbed(target.username, detail, { uuid: target.uuid, ...extras })],
        components: [buildProfileActionRow(target.uuid)],
      });
    } catch (err) {
      await interaction.editReply({ embeds: [buildErrorEmbed(toUserMessage(err))] });
    }
  },
};
