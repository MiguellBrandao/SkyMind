import { linkedAccountRepository } from "../../database/repositories/linkedAccountRepository";
import type { ToolContext } from "../tools/types";

export async function buildToolContext(discordUserId: string): Promise<ToolContext> {
  const linkedAccount = await linkedAccountRepository.findByDiscordId(discordUserId);
  return { discordUserId, linkedAccount };
}
