import { z } from "zod";
import { AccountNotLinkedError } from "../../utils/errors";
import { defineTool } from "./types";

export const getLinkedAccountTool = defineTool({
  name: "get_linked_account",
  description: "Returns the Minecraft account (IGN + UUID) linked to the current Discord user, if any. Always call this first when the user refers to 'my' account and no IGN has been mentioned yet.",
  category: "account",
  alwaysInclude: true,
  schema: z.object({}),
  handler: async (_args, ctx) => {
    if (!ctx.linkedAccount) {
      throw new AccountNotLinkedError();
    }
    return {
      minecraftUsername: ctx.linkedAccount.minecraftUsername,
      minecraftUuid: ctx.linkedAccount.minecraftUuid,
      verifiedAt: ctx.linkedAccount.verifiedAt,
      verificationMethod: ctx.linkedAccount.verificationMethod,
    };
  },
});
