import type { ButtonInteraction } from "discord.js";
import { linkService } from "../../../verification/linkService";
import { buildInfoEmbed } from "../../embeds/errorEmbed";

export async function handleUnlinkConfirm(interaction: ButtonInteraction): Promise<void> {
  const action = interaction.customId.split(":")[1];

  if (action === "cancel") {
    await interaction.update({ content: "Unlink cancelled.", embeds: [], components: [] });
    return;
  }

  const unlinked = await linkService.unlink(interaction.user.id);
  await interaction.update({
    content: null,
    embeds: [unlinked ? buildInfoEmbed("🔓 Account Unlinked", "Your Minecraft account has been unlinked from SkyMind.") : buildInfoEmbed("Nothing to unlink", "You don't have a linked account.")],
    components: [],
  });
}
