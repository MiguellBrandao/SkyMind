import type { ModalSubmitInteraction } from "discord.js";
import { userSettingsRepository } from "../../../database/repositories/userSettingsRepository";
import type { AiProviderChoice } from "../../../database/schema";
import { encryptSecret } from "../../../utils/crypto";
import { buildErrorEmbed, buildInfoEmbed } from "../../embeds/errorEmbed";

const VALID_PROVIDERS: AiProviderChoice[] = ["gemini", "openai", "anthropic", "custom"];

export async function handleSettingsAiModal(interaction: ModalSubmitInteraction): Promise<void> {
  const provider = interaction.customId.split(":")[2];
  await interaction.deferReply({ ephemeral: true });

  if (!provider || !VALID_PROVIDERS.includes(provider as AiProviderChoice)) {
    await interaction.editReply({ embeds: [buildErrorEmbed("Unknown provider selection. Please run /settings ai again.")] });
    return;
  }

  const apiKey = interaction.fields.getTextInputValue("apiKey").trim();
  const model = interaction.fields.getTextInputValue("model").trim();
  const baseUrl = interaction.fields.getTextInputValue("baseUrl").trim();

  if (!apiKey) {
    await interaction.editReply({ embeds: [buildErrorEmbed("An API key is required.")] });
    return;
  }
  if (provider === "custom" && !baseUrl) {
    await interaction.editReply({ embeds: [buildErrorEmbed("A Base URL is required for a custom OpenAI-compatible provider.")] });
    return;
  }

  const encrypted = encryptSecret(apiKey);
  await userSettingsRepository.upsertAiConfig({
    discordUserId: interaction.user.id,
    aiProvider: provider as AiProviderChoice,
    aiModel: model || null,
    encryptedApiKey: encrypted,
    customBaseUrl: baseUrl || null,
  });

  await interaction.editReply({
    embeds: [buildInfoEmbed("✅ AI Provider Updated", `SkyMind will now use your own **${provider}** configuration for \`/ask\`. Your key is encrypted at rest and never logged.`)],
  });
}
