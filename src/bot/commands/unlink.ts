import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { linkService } from "../../verification/linkService";
import { buildInfoEmbed } from "../embeds/errorEmbed";
import { buildUnlinkConfirmRow } from "../interactions/components";
import { editReplyWithExpiry } from "../interactions/componentExpiry";
import type { SlashCommand } from "./types";

export const unlinkCommand: SlashCommand = {
  data: new SlashCommandBuilder().setName("unlink").setDescription("Unlink your Minecraft account from SkyMind"),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    const account = await linkService.getLinkedAccount(interaction.user.id);

    if (!account) {
      await interaction.editReply({ embeds: [buildInfoEmbed("Nothing to unlink", "You don't have a linked account.")] });
      return;
    }

    await editReplyWithExpiry(interaction, {
      embeds: [buildInfoEmbed("Confirm Unlink", `Are you sure you want to unlink **${account.minecraftUsername}**?`)],
      components: [buildUnlinkConfirmRow()],
    });
  },
};
