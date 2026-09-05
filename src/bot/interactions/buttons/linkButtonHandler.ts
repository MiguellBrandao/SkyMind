import type { ButtonInteraction } from "discord.js";
import { linkService } from "../../../verification/linkService";
import { toUserMessage } from "../../../utils/errors";
import { buildErrorEmbed, buildInfoEmbed } from "../../embeds/errorEmbed";

export async function handleLinkConfirm(interaction: ButtonInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });
  try {
    const account = await linkService.confirmCodeChallenge(interaction.user.id);
    await interaction.editReply({
      embeds: [buildInfoEmbed("✅ Account Linked", `Your Discord account is now linked to **${account.minecraftUsername}**. You can revert the Discord field in your Hypixel settings now if you'd like.`)],
    });
  } catch (err) {
    await interaction.editReply({ embeds: [buildErrorEmbed(toUserMessage(err))] });
  }
}
