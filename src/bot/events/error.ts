import { Events, type Client } from "discord.js";
import { logger } from "../../utils/logger";

export function registerErrorEvent(client: Client): void {
  client.on(Events.Error, (err) => logger.error({ err }, "Discord client error"));
  client.on(Events.Warn, (message) => logger.warn({ message }, "Discord client warning"));
}
