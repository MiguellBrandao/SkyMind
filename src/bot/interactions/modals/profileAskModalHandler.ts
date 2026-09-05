import type { ModalSubmitInteraction } from "discord.js";
import { buildToolContext } from "../../../ai/agent/contextBuilder";
import { loadConversationContext, recordTurn } from "../../../ai/agent/conversationMemory";
import { runAgent } from "../../../ai/agent/SkyMindAgent";
import { hypixelClient } from "../../../hypixel/client/HypixelClient";
import { toUserMessage } from "../../../utils/errors";
import { logger } from "../../../utils/logger";
import { chunkMessageText } from "../../../utils/textChunking";

export async function handleProfileAskModal(interaction: ModalSubmitInteraction): Promise<void> {
  const uuid = interaction.customId.split(":")[2];
  const question = interaction.fields.getTextInputValue("question").trim();

  await interaction.deferReply({ ephemeral: true });

  try {
    let contextualMessage = question;
    if (uuid) {
      try {
        const player = await hypixelClient.getPlayer(uuid);
        contextualMessage = `Regarding the SkyBlock player ${player.displayname}: ${question}`;
      } catch {
        // Fall back to the raw question if the player lookup fails.
      }
    }

    const toolContext = await buildToolContext(interaction.user.id);
    const history = await loadConversationContext(interaction.user.id);
    const result = await runAgent({ discordUserId: interaction.user.id, userMessage: contextualMessage, history, toolContext });
    await recordTurn(interaction.user.id, contextualMessage, result.reply);

    const [first, ...rest] = chunkMessageText(result.reply);
    await interaction.editReply({ content: first });
    for (const chunk of rest) {
      await interaction.followUp({ content: chunk, ephemeral: true });
    }
  } catch (err) {
    logger.error({ err }, "Profile ask modal failed");
    await interaction.editReply({ content: `❌ ${toUserMessage(err)}` });
  }
}
