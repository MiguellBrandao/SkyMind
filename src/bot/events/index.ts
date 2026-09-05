import type { Client } from "discord.js";
import { registerErrorEvent } from "./error";
import { registerInteractionCreateEvent } from "./interactionCreate";
import { registerReadyEvent } from "./ready";

export function registerEvents(client: Client): void {
  registerReadyEvent(client);
  registerInteractionCreateEvent(client);
  registerErrorEvent(client);
}
