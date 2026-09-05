import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { conversationRepository } from "../../database/repositories/conversationRepository";
import { linkedAccountRepository } from "../../database/repositories/linkedAccountRepository";
import { userSettingsRepository } from "../../database/repositories/userSettingsRepository";
import { toUserMessage } from "../../utils/errors";
import { linkService } from "../../verification/linkService";
import { buildErrorEmbed, buildInfoEmbed } from "../embeds/errorEmbed";
import { buildAiProviderSelectRow } from "../interactions/components";
import { replyWithExpiry } from "../interactions/componentExpiry";
import type { SlashCommand } from "./types";

export const settingsCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("settings")
    .setDescription("Configure your SkyMind preferences")
    .addSubcommand((sub) => sub.setName("ai").setDescription("Choose which AI provider SkyMind uses for your requests"))
    .addSubcommand((sub) =>
      sub
        .setName("default-profile")
        .setDescription("Change which SkyBlock profile /profile, /stats, and /ask use by default")
        .addStringOption((opt) => opt.setName("profile").setDescription("Profile cute name, e.g. Kiwi").setRequired(true).setMaxLength(32)),
    )
    .addSubcommand((sub) => sub.setName("delete-data").setDescription("Delete all data SkyMind has stored about you")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "ai") {
      await replyWithExpiry(interaction, {
        embeds: [buildInfoEmbed("🤖 AI Provider", "Choose which AI provider SkyMind should use for `/ask` and AI-powered buttons. Your key is encrypted at rest and never logged.")],
        components: [buildAiProviderSelectRow()],
        ephemeral: true,
      });
      return;
    }

    if (sub === "default-profile") {
      await interaction.deferReply({ ephemeral: true });
      const profileName = interaction.options.getString("profile", true);
      try {
        const result = await linkService.setDefaultProfile(interaction.user.id, profileName);
        if (!result.success) {
          await interaction.editReply({
            embeds: [buildErrorEmbed(`Couldn't find a profile named **${profileName}** on your linked account. Check the spelling (e.g. Kiwi, Papaya, Watermelon).`)],
          });
          return;
        }
        await interaction.editReply({
          embeds: [buildInfoEmbed("✅ Default Profile Updated", `\`/profile\`, \`/stats\`, and \`/ask\` will now default to your **${profileName}** profile.`)],
        });
      } catch (err) {
        await interaction.editReply({ embeds: [buildErrorEmbed(toUserMessage(err))] });
      }
      return;
    }

    if (sub === "delete-data") {
      await interaction.deferReply({ ephemeral: true });
      await Promise.all([
        linkedAccountRepository.deleteByDiscordId(interaction.user.id),
        userSettingsRepository.deleteAllUserData(interaction.user.id),
        conversationRepository.clear(interaction.user.id),
      ]);
      await interaction.editReply({
        embeds: [buildInfoEmbed("🗑️ Data Deleted", "All data SkyMind stored about you (linked account, AI settings, conversation history) has been permanently deleted.")],
      });
    }
  },
};
