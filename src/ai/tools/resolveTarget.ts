import { resolveIgnToUuid } from "../../hypixel/client/mojangClient";
import { AccountNotLinkedError } from "../../utils/errors";
import type { ToolContext } from "./types";

export interface ResolvedTarget {
  uuid: string;
  username: string;
}

/**
 * Resolves which Minecraft account a tool call should operate on: an explicit `ign` argument
 * takes priority (so users can ask about other players), otherwise falls back to the calling
 * Discord user's own linked account.
 */
export async function resolveTarget(args: { ign?: string | undefined }, ctx: ToolContext): Promise<ResolvedTarget> {
  if (args.ign) {
    return resolveIgnToUuid(args.ign);
  }
  if (ctx.linkedAccount) {
    return { uuid: ctx.linkedAccount.minecraftUuid, username: ctx.linkedAccount.minecraftUsername };
  }
  throw new AccountNotLinkedError();
}
