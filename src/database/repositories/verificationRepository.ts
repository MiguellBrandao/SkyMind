import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "../client";
import { verificationCodes, type VerificationCode } from "../schema";

const VERIFICATION_TTL_MS = 15 * 60 * 1000;

export const verificationRepository = {
  async create(params: { discordUserId: string; minecraftUuid: string; minecraftUsername: string; code: string }): Promise<VerificationCode> {
    const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);
    const rows = await db
      .insert(verificationCodes)
      .values({ ...params, expiresAt })
      .returning();
    const row = rows[0];
    if (!row) throw new Error("Failed to create verification code");
    return row;
  },

  async findActiveForUser(discordUserId: string): Promise<VerificationCode | undefined> {
    const rows = await db
      .select()
      .from(verificationCodes)
      .where(and(eq(verificationCodes.discordUserId, discordUserId), isNull(verificationCodes.consumedAt), gt(verificationCodes.expiresAt, new Date())))
      .orderBy(verificationCodes.createdAt);
    return rows.at(-1);
  },

  async markConsumed(id: string): Promise<void> {
    await db.update(verificationCodes).set({ consumedAt: new Date() }).where(eq(verificationCodes.id, id));
  },
};

export { VERIFICATION_TTL_MS };
