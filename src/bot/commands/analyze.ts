import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { hypixelClient } from "../../hypixel/client/HypixelClient";
import { marketService } from "../../skyblock/services/marketService";
import { analyzeProfile } from "../../skyblock/services/profileAnalyzer";
import { profileService } from "../../skyblock/services/profileService";
import { toUserMessage } from "../../utils/errors";
import { buildAnalyzeEmbed } from "../embeds/analyzeEmbed";
import { buildErrorEmbed } from "../embeds/errorEmbed";
import { buildProfileActionRow } from "../interactions/components";
import { resolveCommandTarget } from "./resolveCommandTarget";
import type { SlashCommand } from "./types";

export const analyzeCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("analyze")
    .setDescription("Get a full progression analysis: scores, bottlenecks, and upgrade directions")
    .addStringOption((opt) => opt.setName("ign").setDescription("Minecraft username (defaults to your linked account)").setMaxLength(16)),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    try {
      const target = await resolveCommandTarget(interaction);
      const [detail, bazaar] = await Promise.all([profileService.getDetail(target.uuid), hypixelClient.getBazaar()]);
      const priceLookup = marketService.buildBazaarPriceLookup(bazaar.products ?? {});
      const analysis = analyzeProfile(detail, priceLookup);
      await interaction.editReply({ embeds: [buildAnalyzeEmbed(target.username, analysis)], components: [buildProfileActionRow(target.uuid)] });
    } catch (err) {
      await interaction.editReply({ embeds: [buildErrorEmbed(toUserMessage(err))] });
    }
  },
};
