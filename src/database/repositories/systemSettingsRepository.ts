import { eq } from "drizzle-orm";
import { db } from "../client";
import { systemSettings } from "../schema";

export const systemSettingsRepository = {
  async get<T>(key: string, fallback: T): Promise<T> {
    const rows = await db.select().from(systemSettings).where(eq(systemSettings.key, key)).limit(1);
    const row = rows[0];
    if (!row) return fallback;
    return row.value as T;
  },

  async set(key: string, value: unknown): Promise<void> {
    await db
      .insert(systemSettings)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({ target: systemSettings.key, set: { value, updatedAt: new Date() } });
  },
};

export const SYSTEM_SETTING_KEYS = {
  allowMultiLink: "allow_multi_link",
  botMaintenance: "bot_maintenance",
} as const;
