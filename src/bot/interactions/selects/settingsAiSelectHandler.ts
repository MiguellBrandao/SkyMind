import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, type StringSelectMenuInteraction } from "discord.js";
import { userSettingsRepository } from "../../../database/repositories/userSettingsRepository";
import { buildInfoEmbed } from "../../embeds/errorEmbed";

export async function handleSettingsAiSelect(interaction: StringSelectMenuInteraction): Promise<void> {
  const choice = interaction.values[0];

  if (!choice || choice === "default") {
    await userSettingsRepository.clearApiKey(interaction.user.id);
    await interaction.update({ embeds: [buildInfoEmbed("✅ AI Provider Updated", "You're now using SkyMind's default AI provider.")], components: [] });
    return;
  }

  const modal = new ModalBuilder().setCustomId(`settings:ai-modal:${choice}`).setTitle(`Configure ${choice} provider`);

  const apiKeyInput = new TextInputBuilder().setCustomId("apiKey").setLabel("API Key").setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(200);
  const modelInput = new TextInputBuilder().setCustomId("model").setLabel("Model override (optional)").setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(100);
  const baseUrlInput = new TextInputBuilder()
    .setCustomId("baseUrl")
    .setLabel("Base URL (required for Custom only)")
    .setStyle(TextInputStyle.Short)
    .setRequired(choice === "custom")
    .setMaxLength(200);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(apiKeyInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(modelInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(baseUrlInput),
  );

  await interaction.showModal(modal);
}
