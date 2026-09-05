import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { linkService } from "../../verification/linkService";
import { toUserMessage } from "../../utils/errors";
import { buildErrorEmbed, buildInfoEmbed } from "../embeds/errorEmbed";
import { buildLinkConfirmRow } from "../interactions/components";
import type { SlashCommand } from "./types";

function profileNotFoundNote(profileName: string | undefined): string {
  return profileName ? `\n\n⚠️ Couldn't find a profile named **${profileName}** to set as default - your default profile wasn't changed. You can set it later with \`/settings default-profile\`.` : "";
}

export const linkCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("link")
    .setDescription("Link your Discord account to a Minecraft/Hypixel account")
    .addStringOption((opt) => opt.setName("ign").setDescription("Your Minecraft username").setRequired(true).setMaxLength(16))
    .addStringOption((opt) => opt.setName("profile").setDescription("Default SkyBlock profile to use (e.g. Kiwi) - can be changed later with /settings default-profile").setMaxLength(32)),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    const ign = interaction.options.getString("ign", true);
    const profile = interaction.options.getString("profile") ?? undefined;

    try {
      const result = await linkService.startLink(
        interaction.user.id,
        ign,
        { username: interaction.user.username, discriminator: interaction.user.discriminator, globalName: interaction.user.globalName },
        profile,
      );

      if (result.status === "linked") {
        await interaction.editReply({
          embeds: [
            buildInfoEmbed(
              "✅ Account Linked!",
              `Your Discord account is now linked to **${result.account.minecraftUsername}** (verified via your Hypixel Discord social field).${profileNotFoundNote(result.profileNameNotFound)}`,
            ),
          ],
        });
        return;
      }

      await interaction.editReply({
        embeds: [
          buildInfoEmbed(
            "🔐 One More Step",
            [
              "I couldn't automatically confirm your Discord tag, so let's verify a different way.",
              "",
              "1. In Minecraft, go to **SkyBlock Menu -> Settings -> Socials & API -> Discord**",
              `2. Temporarily set it to this code: \`${result.code}\``,
              `3. Come back and click the button below within ${result.expiresInMinutes} minutes.`,
              "",
              "You can revert it back to your real Discord tag afterward - SkyMind doesn't need it set permanently.",
            ].join("\n") + profileNotFoundNote(result.profileNameNotFound),
          ),
        ],
        components: [buildLinkConfirmRow()],
      });
    } catch (err) {
      await interaction.editReply({ embeds: [buildErrorEmbed(toUserMessage(err))] });
    }
  },
};
