import { and, asc, eq, lt } from "drizzle-orm";
import { db } from "../client";
import { conversationMessages, type ConversationRole } from "../schema";

const MAX_MESSAGES_PER_USER = 20;

export const conversationRepository = {
  async append(discordUserId: string, role: ConversationRole, content: string): Promise<void> {
    await db.insert(conversationMessages).values({ discordUserId, role, content });
    await this.trim(discordUserId);
  },

  async getRecent(discordUserId: string, limit = MAX_MESSAGES_PER_USER): Promise<{ role: ConversationRole; content: string }[]> {
    const rows = await db
      .select({ role: conversationMessages.role, content: conversationMessages.content, createdAt: conversationMessages.createdAt })
      .from(conversationMessages)
      .where(eq(conversationMessages.discordUserId, discordUserId))
      .orderBy(asc(conversationMessages.createdAt));
    return rows.slice(-limit).map((r) => ({ role: r.role, content: r.content }));
  },

  async trim(discordUserId: string): Promise<void> {
    const rows = await db
      .select({ id: conversationMessages.id, createdAt: conversationMessages.createdAt })
      .from(conversationMessages)
      .where(eq(conversationMessages.discordUserId, discordUserId))
      .orderBy(asc(conversationMessages.createdAt));
    if (rows.length <= MAX_MESSAGES_PER_USER) return;
    const cutoffRow = rows[rows.length - MAX_MESSAGES_PER_USER];
    if (!cutoffRow) return;
    await db.delete(conversationMessages).where(and(eq(conversationMessages.discordUserId, discordUserId), lt(conversationMessages.createdAt, cutoffRow.createdAt)));
  },

  async clear(discordUserId: string): Promise<void> {
    await db.delete(conversationMessages).where(eq(conversationMessages.discordUserId, discordUserId));
  },
};
