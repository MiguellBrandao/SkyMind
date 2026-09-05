import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { buildToolContext } from "../../ai/agent/contextBuilder";
import { loadConversationContext, recordTurn } from "../../ai/agent/conversationMemory";
import { runAgent } from "../../ai/agent/SkyMindAgent";
import { toUserMessage } from "../../utils/errors";
import { chunkMessageText } from "../../utils/textChunking";
import { buildErrorEmbed } from "../embeds/errorEmbed";
import type { SlashCommand } from "./types";

export const askCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("ask")
    .setDescription("Ask SkyMind AI anything about Hypixel SkyBlock")
    .addStringOption((opt) => opt.setName("message").setDescription("Your question").setRequired(true).setMaxLength(500)),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const message = interaction.options.getString("message", true);

    try {
      const toolContext = await buildToolContext(interaction.user.id);
      const history = await loadConversationContext(interaction.user.id);
      const result = await runAgent({ discordUserId: interaction.user.id, userMessage: message, history, toolContext });
      await recordTurn(interaction.user.id, message, result.reply);

      const [first, ...rest] = chunkMessageText(result.reply);
      await interaction.editReply({ content: first });
      for (const chunk of rest) {
        await interaction.followUp({ content: chunk });
      }
    } catch (err) {
      await interaction.editReply({ embeds: [buildErrorEmbed(toUserMessage(err))] });
    }
  },
};
