import { index, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const verificationMethodValues = ["social_field", "code_challenge"] as const;
export type VerificationMethod = (typeof verificationMethodValues)[number];

export const linkedAccounts = pgTable(
  "linked_accounts",
  {
    discordUserId: text("discord_user_id").primaryKey(),
    minecraftUuid: varchar("minecraft_uuid", { length: 32 }).notNull(),
    minecraftUsername: varchar("minecraft_username", { length: 16 }).notNull(),
    /** SkyBlock profile_id used as the default when a command doesn't specify one; falls back to Hypixel's in-game "selected" profile when unset. */
    defaultProfileId: varchar("default_profile_id", { length: 64 }),
    verifiedAt: timestamp("verified_at", { withTimezone: true }).notNull().defaultNow(),
    verificationMethod: varchar("verification_method", { length: 32 }).notNull().$type<VerificationMethod>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("linked_accounts_minecraft_uuid_idx").on(table.minecraftUuid)],
);

export type LinkedAccount = typeof linkedAccounts.$inferSelect;
export type NewLinkedAccount = typeof linkedAccounts.$inferInsert;
