import { Events, type Client } from "discord.js";
import { toUserMessage } from "../../utils/errors";
import { logger } from "../../utils/logger";
import { commandsByName } from "../commands";
import { routeInteraction } from "../interactions/router";

export function registerInteractionCreateEvent(client: Client): void {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isChatInputCommand()) {
      const command = commandsByName.get(interaction.commandName);
      if (!command) {
        logger.warn({ command: interaction.commandName }, "Unknown command invoked");
        return;
      }

      try {
        await command.execute(interaction);
      } catch (err) {
        logger.error({ err, command: interaction.commandName }, "Command execution failed");
        const content = `❌ ${toUserMessage(err)}`;
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ content }).catch(() => undefined);
        } else {
          await interaction.reply({ content, ephemeral: true }).catch(() => undefined);
        }
      }
      return;
    }

    await routeInteraction(interaction);
  });
}
