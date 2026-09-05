import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const aiProviderChoiceValues = ["default", "gemini", "openai", "anthropic", "custom"] as const;
export type AiProviderChoice = (typeof aiProviderChoiceValues)[number];

export const userSettings = pgTable("user_settings", {
  discordUserId: text("discord_user_id").primaryKey(),
  aiProvider: varchar("ai_provider", { length: 16 }).notNull().default("default").$type<AiProviderChoice>(),
  aiModel: varchar("ai_model", { length: 64 }),
  encryptedApiKey: text("encrypted_api_key"),
  customBaseUrl: text("custom_base_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;
