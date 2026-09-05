import type { ChatInputCommandInteraction } from "discord.js";
import { linkedAccountRepository } from "../../database/repositories/linkedAccountRepository";
import { resolveIgnToUuid } from "../../hypixel/client/mojangClient";
import { AccountNotLinkedError } from "../../utils/errors";

export async function resolveCommandTarget(interaction: ChatInputCommandInteraction): Promise<{ uuid: string; username: string; profileId?: string }> {
  const ign = interaction.options.getString("ign");
  if (ign) return resolveIgnToUuid(ign);

  const account = await linkedAccountRepository.findByDiscordId(interaction.user.id);
  if (!account) throw new AccountNotLinkedError();
  return { uuid: account.minecraftUuid, username: account.minecraftUsername, profileId: account.defaultProfileId ?? undefined };
}
