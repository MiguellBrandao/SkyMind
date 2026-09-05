import { bigserial, index, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const conversationRoleValues = ["user", "assistant", "tool"] as const;
export type ConversationRole = (typeof conversationRoleValues)[number];

export const conversationMessages = pgTable(
  "conversation_messages",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    discordUserId: text("discord_user_id").notNull(),
    role: varchar("role", { length: 16 }).notNull().$type<ConversationRole>(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("conversation_messages_user_created_idx").on(table.discordUserId, table.createdAt)],
);

export type ConversationMessage = typeof conversationMessages.$inferSelect;
export type NewConversationMessage = typeof conversationMessages.$inferInsert;
