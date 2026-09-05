import { index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const verificationCodes = pgTable(
  "verification_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    discordUserId: text("discord_user_id").notNull(),
    minecraftUuid: varchar("minecraft_uuid", { length: 32 }).notNull(),
    minecraftUsername: varchar("minecraft_username", { length: 16 }).notNull(),
    code: varchar("code", { length: 16 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("verification_codes_discord_user_idx").on(table.discordUserId)],
);

export type VerificationCode = typeof verificationCodes.$inferSelect;
export type NewVerificationCode = typeof verificationCodes.$inferInsert;
