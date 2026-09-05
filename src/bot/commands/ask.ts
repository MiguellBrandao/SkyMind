import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { buildToolContext } from "../../ai/agent/contextBuilder";
import { loadConversationContext, recordTurn } from "../../ai/agent/conversationMemory";
import { runAgent } from "../../ai/agent/SkyMindAgent";
import { SYSTEM_SETTING_KEYS, systemSettingsRepository } from "../../database/repositories/systemSettingsRepository";
import { toUserMessage } from "../../utils/errors";
import { buildErrorEmbed } from "../embeds/errorEmbed";
import type { SlashCommand } from "./types";

const DISCORD_MESSAGE_LIMIT = 1900;

export const askCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("ask")
    .setDescription("Ask SkyMind AI anything about Hypixel SkyBlock")
    .addStringOption((opt) => opt.setName("message").setDescription("Your question").setRequired(true).setMaxLength(500)),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const message = interaction.options.getString("message", true);

    try {
      const maintenance = await systemSettingsRepository.get<boolean>(SYSTEM_SETTING_KEYS.botMaintenance, false);
      if (maintenance) {
        await interaction.editReply({ embeds: [buildErrorEmbed("SkyMind's AI features are temporarily under maintenance. Please try again later.")] });
        return;
      }

      const toolContext = await buildToolContext(interaction.user.id);
      const history = await loadConversationContext(interaction.user.id);
      const result = await runAgent({ discordUserId: interaction.user.id, userMessage: message, history, toolContext });
      await recordTurn(interaction.user.id, message, result.reply);

      const reply = result.reply.length > DISCORD_MESSAGE_LIMIT ? `${result.reply.slice(0, DISCORD_MESSAGE_LIMIT)}...` : result.reply;
      await interaction.editReply({ content: reply });
    } catch (err) {
      await interaction.editReply({ embeds: [buildErrorEmbed(toUserMessage(err))] });
    }
  },
};
