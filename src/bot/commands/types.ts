import type { ChatInputCommandInteraction } from "discord.js";

export interface SlashCommandJson {
  name: string;
  toJSON: () => unknown;
}

export interface SlashCommand {
  data: SlashCommandJson;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
