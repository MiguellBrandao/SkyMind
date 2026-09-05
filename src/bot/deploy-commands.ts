import { REST, Routes } from "discord.js";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { commands } from "./commands";

async function main(): Promise<void> {
  const rest = new REST().setToken(env.DISCORD_BOT_TOKEN);
  const body = commands.map((command) => command.data.toJSON());

  const route = env.DISCORD_DEV_GUILD_ID
    ? Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_DEV_GUILD_ID)
    : Routes.applicationCommands(env.DISCORD_CLIENT_ID);

  logger.info({ count: body.length, scope: env.DISCORD_DEV_GUILD_ID ? `guild:${env.DISCORD_DEV_GUILD_ID}` : "global" }, "Deploying slash commands...");
  await rest.put(route, { body });
  logger.info("Slash commands deployed successfully.");
}

main().catch((err) => {
  logger.error({ err }, "Failed to deploy slash commands");
  process.exit(1);
});
