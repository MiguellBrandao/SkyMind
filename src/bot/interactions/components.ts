import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from "discord.js";

export type ProfileCardView = "profile" | "stats";

/**
 * The middle button toggles between the overview card and the detailed stats card. `profileId`
 * is threaded through every button's customId so toggle/refresh keep showing whichever SkyBlock
 * profile is currently selected (via the dropdown) instead of resetting to the account's default.
 */
export function buildProfileActionRow(uuid: string, view: ProfileCardView, profileId: string): ActionRowBuilder<ButtonBuilder> {
  const toggle =
    view === "profile"
      ? new ButtonBuilder().setCustomId(`profile:toggle:${uuid}:${view}:${profileId}`).setLabel("View Stats").setStyle(ButtonStyle.Secondary).setEmoji("📈")
      : new ButtonBuilder().setCustomId(`profile:toggle:${uuid}:${view}:${profileId}`).setLabel("View Profile").setStyle(ButtonStyle.Secondary).setEmoji("📊");

  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    toggle,
    new ButtonBuilder().setCustomId(`profile:ask:${uuid}:${view}:${profileId}`).setLabel("Ask AI").setStyle(ButtonStyle.Success).setEmoji("🤖"),
    new ButtonBuilder().setCustomId(`profile:refresh:${uuid}:${view}:${profileId}`).setLabel("Refresh").setStyle(ButtonStyle.Secondary).setEmoji("🔄"),
  );
}

export interface ProfileSelectOption {
  profileId: string;
  label: string;
  selected: boolean;
}

/** `namespace` lets /networth reuse this same dropdown independently of the profile/stats card. */
export function buildProfileSelectRow(uuid: string, view: string, profiles: ProfileSelectOption[], namespace = "profile"): ActionRowBuilder<StringSelectMenuBuilder> {
  const select = new StringSelectMenuBuilder()
    .setCustomId(`${namespace}:select-profile:${uuid}:${view}`)
    .setPlaceholder("Switch SkyBlock profile")
    .addOptions(profiles.slice(0, 25).map((p) => ({ label: p.label, value: p.profileId, default: p.selected })));
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
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
