import { eq } from "drizzle-orm";
import { db } from "../client";
import { userSettings, type AiProviderChoice, type UserSettings } from "../schema";

export const userSettingsRepository = {
  async find(discordUserId: string): Promise<UserSettings | undefined> {
    const rows = await db.select().from(userSettings).where(eq(userSettings.discordUserId, discordUserId)).limit(1);
    return rows[0];
  },

  async upsertAiConfig(params: {
    discordUserId: string;
    aiProvider: AiProviderChoice;
    aiModel?: string | null;
    encryptedApiKey?: string | null;
    customBaseUrl?: string | null;
  }): Promise<UserSettings> {
    const now = new Date();
    const rows = await db
      .insert(userSettings)
      .values({
        discordUserId: params.discordUserId,
        aiProvider: params.aiProvider,
        aiModel: params.aiModel ?? null,
        encryptedApiKey: params.encryptedApiKey ?? null,
        customBaseUrl: params.customBaseUrl ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: userSettings.discordUserId,
        set: {
          aiProvider: params.aiProvider,
          aiModel: params.aiModel ?? null,
          encryptedApiKey: params.encryptedApiKey ?? null,
          customBaseUrl: params.customBaseUrl ?? null,
          updatedAt: now,
        },
      })
      .returning();
    const row = rows[0];
    if (!row) throw new Error("Failed to upsert user settings");
    return row;
  },

  async clearApiKey(discordUserId: string): Promise<void> {
    await db
      .update(userSettings)
      .set({ aiProvider: "default", aiModel: null, encryptedApiKey: null, customBaseUrl: null, updatedAt: new Date() })
      .where(eq(userSettings.discordUserId, discordUserId));
  },

  async deleteAllUserData(discordUserId: string): Promise<void> {
    await db.delete(userSettings).where(eq(userSettings.discordUserId, discordUserId));
  },
};
