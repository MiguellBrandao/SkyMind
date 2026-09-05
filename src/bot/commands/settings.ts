import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { conversationRepository } from "../../database/repositories/conversationRepository";
import { linkedAccountRepository } from "../../database/repositories/linkedAccountRepository";
import { userSettingsRepository } from "../../database/repositories/userSettingsRepository";
import { buildInfoEmbed } from "../embeds/errorEmbed";
import { buildAiProviderSelectRow } from "../interactions/components";
import type { SlashCommand } from "./types";

export const settingsCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("settings")
    .setDescription("Configure your SkyMind preferences")
    .addSubcommand((sub) => sub.setName("ai").setDescription("Choose which AI provider SkyMind uses for your requests"))
    .addSubcommand((sub) =>
      sub
        .setName("memory")
        .setDescription("Tell SkyMind about your preferred class, goals, or budget")
        .addStringOption((opt) => opt.setName("preferred_class").setDescription("Your preferred dungeon class").setMaxLength(32))
        .addStringOption((opt) => opt.setName("goals").setDescription("Your current SkyBlock goals").setMaxLength(200))
        .addStringOption((opt) => opt.setName("budget").setDescription("Your current coin budget").setMaxLength(64)),
    )
    .addSubcommand((sub) => sub.setName("delete-data").setDescription("Delete all data SkyMind has stored about you")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "ai") {
      await interaction.reply({
        embeds: [buildInfoEmbed("🤖 AI Provider", "Choose which AI provider SkyMind should use for `/ask` and AI-powered buttons. Your key is encrypted at rest and never logged.")],
        components: [buildAiProviderSelectRow()],
        ephemeral: true,
      });
      return;
    }

    if (sub === "memory") {
      await interaction.deferReply({ ephemeral: true });
      const preferredClass = interaction.options.getString("preferred_class");
      const goals = interaction.options.getString("goals");
      const budget = interaction.options.getString("budget");

      if (!preferredClass && !goals && !budget) {
        const existing = await userSettingsRepository.find(interaction.user.id);
        await interaction.editReply({
          embeds: [
            buildInfoEmbed(
              "Your Remembered Context",
              [`Preferred class: ${existing?.preferredClass ?? "not set"}`, `Goals: ${existing?.goals ?? "not set"}`, `Budget: ${existing?.budget ?? "not set"}`].join("\n"),
            ),
          ],
        });
        return;
      }

      await userSettingsRepository.upsertMemory({ discordUserId: interaction.user.id, preferredClass, goals, budget });
      await interaction.editReply({
        embeds: [buildInfoEmbed("✅ Preferences Saved", "SkyMind will keep this in mind for future conversations (live account data is always re-checked from the API).")],
      });
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
