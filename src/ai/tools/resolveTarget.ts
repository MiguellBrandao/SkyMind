import { resolveIgnToUuid } from "../../hypixel/client/mojangClient";
import { AccountNotLinkedError } from "../../utils/errors";
import type { ToolContext } from "./types";

export interface ResolvedTarget {
  uuid: string;
  username: string;
  /** The account's saved default SkyBlock profile, if any (only set when resolving the caller's own linked account). */
  profileId?: string;
}

/**
 * Resolves which Minecraft account a tool call should operate on: an explicit `ign` argument
 * takes priority (so users can ask about other players), otherwise falls back to the calling
 * Discord user's own linked account (and its saved default profile, if set).
 */
export async function resolveTarget(args: { ign?: string | undefined }, ctx: ToolContext): Promise<ResolvedTarget> {
  if (args.ign) {
    return resolveIgnToUuid(args.ign);
  }
  if (ctx.linkedAccount) {
    return { uuid: ctx.linkedAccount.minecraftUuid, username: ctx.linkedAccount.minecraftUsername, profileId: ctx.linkedAccount.defaultProfileId ?? undefined };
  }
  throw new AccountNotLinkedError();
}
