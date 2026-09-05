import { eq, ne, and } from "drizzle-orm";
import { db } from "../client";
import { linkedAccounts, type LinkedAccount, type VerificationMethod } from "../schema";

export const linkedAccountRepository = {
  async findByDiscordId(discordUserId: string): Promise<LinkedAccount | undefined> {
    const rows = await db.select().from(linkedAccounts).where(eq(linkedAccounts.discordUserId, discordUserId)).limit(1);
    return rows[0];
  },

  async findByMinecraftUuid(minecraftUuid: string): Promise<LinkedAccount[]> {
    return db.select().from(linkedAccounts).where(eq(linkedAccounts.minecraftUuid, minecraftUuid));
  },

  async findOtherLinksForUuid(minecraftUuid: string, excludingDiscordUserId: string): Promise<LinkedAccount[]> {
    return db
      .select()
      .from(linkedAccounts)
      .where(and(eq(linkedAccounts.minecraftUuid, minecraftUuid), ne(linkedAccounts.discordUserId, excludingDiscordUserId)));
  },

  async upsert(params: {
    discordUserId: string;
    minecraftUuid: string;
    minecraftUsername: string;
    verificationMethod: VerificationMethod;
  }): Promise<LinkedAccount> {
    const now = new Date();
    const rows = await db
      .insert(linkedAccounts)
      .values({
        discordUserId: params.discordUserId,
        minecraftUuid: params.minecraftUuid,
        minecraftUsername: params.minecraftUsername,
        verificationMethod: params.verificationMethod,
        verifiedAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: linkedAccounts.discordUserId,
        set: {
          minecraftUuid: params.minecraftUuid,
          minecraftUsername: params.minecraftUsername,
          verificationMethod: params.verificationMethod,
          verifiedAt: now,
          updatedAt: now,
        },
      })
      .returning();
    const row = rows[0];
    if (!row) throw new Error("Failed to upsert linked account");
    return row;
  },

  async deleteByDiscordId(discordUserId: string): Promise<boolean> {
    const rows = await db.delete(linkedAccounts).where(eq(linkedAccounts.discordUserId, discordUserId)).returning();
    return rows.length > 0;
  },

  async countAll(): Promise<number> {
    const rows = await db.select().from(linkedAccounts);
    return rows.length;
  },
};
