import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, type ButtonInteraction } from "discord.js";
import { cacheKeys } from "../../../hypixel/cache/cacheKeys";
import { invalidateCache } from "../../../hypixel/cache/cachedFetch";
import { toUserMessage } from "../../../utils/errors";
import { logger } from "../../../utils/logger";
import { buildErrorEmbed } from "../../embeds/errorEmbed";
import type { ProfileCardView } from "../components";
import { editReplyWithExpiry } from "../componentExpiry";
import { buildProfileCard } from "../profileCard";

export async function handleProfileAction(interaction: ButtonInteraction): Promise<void> {
  const parts = interaction.customId.split(":");
  const action = parts[1];
  const uuid = parts[2];
  const currentView: ProfileCardView = parts[3] === "stats" ? "stats" : "profile";
  const profileId = parts[4];
  if (!uuid) return;

  if (action === "ask") {
    const modal = new ModalBuilder().setCustomId(`profile:ask-modal:${uuid}`).setTitle("Ask SkyMind AI");
    const input = new TextInputBuilder().setCustomId("question").setLabel("What do you want to ask?").setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(500);
    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
    await interaction.showModal(modal);
    return;
  }

  await interaction.deferUpdate();

  try {
    if (action === "refresh") {
      await Promise.all([invalidateCache(cacheKeys.player(uuid)), invalidateCache(cacheKeys.profiles(uuid))]);
    }

    // "toggle" flips to the other view; "refresh" re-renders whichever view was already showing.
    // Both keep showing the same profileId that was already on screen.
    const targetView: ProfileCardView = action === "toggle" ? (currentView === "profile" ? "stats" : "profile") : currentView;

    const message = await buildProfileCard(uuid, targetView, profileId);
    await editReplyWithExpiry(interaction, message);
  } catch (err) {
    logger.error({ err, action }, "Profile action button failed");
    await interaction.editReply({ embeds: [buildErrorEmbed(toUserMessage(err))], components: [] });
  }
}
