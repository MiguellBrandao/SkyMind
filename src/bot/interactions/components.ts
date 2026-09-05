import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from "discord.js";

export function buildProfileActionRow(uuid: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`profile:stats:${uuid}`).setLabel("View Stats").setStyle(ButtonStyle.Secondary).setEmoji("📈"),
    new ButtonBuilder().setCustomId(`profile:ask:${uuid}`).setLabel("Ask AI").setStyle(ButtonStyle.Success).setEmoji("🤖"),
    new ButtonBuilder().setCustomId(`profile:refresh:${uuid}`).setLabel("Refresh").setStyle(ButtonStyle.Secondary).setEmoji("🔄"),
  );
}

export function buildLinkConfirmRow(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("link:confirm").setLabel("I've set the code - Confirm").setStyle(ButtonStyle.Success).setEmoji("✅"),
  );
}

export function buildUnlinkConfirmRow(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("unlink:confirm").setLabel("Confirm Unlink").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("unlink:cancel").setLabel("Cancel").setStyle(ButtonStyle.Secondary),
  );
}

export function buildAiProviderSelectRow(): ActionRowBuilder<StringSelectMenuBuilder> {
  const select = new StringSelectMenuBuilder()
    .setCustomId("settings:ai-provider")
    .setPlaceholder("Choose an AI provider")
    .addOptions(
      { label: "Default (SkyMind's built-in provider)", value: "default", emoji: "⭐" },
      { label: "Google Gemini", value: "gemini", emoji: "✨" },
      { label: "OpenAI", value: "openai", emoji: "🧠" },
      { label: "Anthropic", value: "anthropic", emoji: "🤖" },
      { label: "Custom (OpenAI-compatible)", value: "custom", emoji: "🔧" },
    );
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
}
