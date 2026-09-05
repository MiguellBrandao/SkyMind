import { Events, type Client } from "discord.js";
import { logger } from "../../utils/logger";

export function registerReadyEvent(client: Client): void {
  client.once(Events.ClientReady, (readyClient) => {
    logger.info({ tag: readyClient.user.tag, guilds: readyClient.guilds.cache.size }, "SkyMind is online");
  });
}
