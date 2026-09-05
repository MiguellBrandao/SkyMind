import { jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

/** Small key/value store for admin-toggleable settings, e.g. allow_multi_link. */
export const systemSettings = pgTable("system_settings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SystemSetting = typeof systemSettings.$inferSelect;
export type NewSystemSetting = typeof systemSettings.$inferInsert;
