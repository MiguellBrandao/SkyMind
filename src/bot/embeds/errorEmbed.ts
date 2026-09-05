import { EmbedBuilder } from "discord.js";
import { COLORS } from "./colors";

export function buildErrorEmbed(message: string): EmbedBuilder {
  return new EmbedBuilder().setColor(COLORS.danger).setDescription(`❌ ${message}`);
}

export function buildInfoEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder().setColor(COLORS.info).setTitle(title).setDescription(description);
}
