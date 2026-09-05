import { conversationRepository } from "../../database/repositories/conversationRepository";
import type { ChatMessage } from "../providers/types";

/**
 * Loads prior turns as plain user/assistant text (never persisted tool calls or raw API dumps -
 * see recordTurn). Live account data is intentionally NOT cached here; the agent always re-fetches
 * it via tools on every turn.
 */
export async function loadConversationContext(discordUserId: string): Promise<ChatMessage[]> {
  const history = await conversationRepository.getRecent(discordUserId);
  return history.map((m) => ({ role: m.role === "tool" ? "assistant" : m.role, content: m.content }));
}

export async function recordTurn(discordUserId: string, userMessage: string, assistantReply: string): Promise<void> {
  await conversationRepository.append(discordUserId, "user", userMessage);
  await conversationRepository.append(discordUserId, "assistant", assistantReply);
}
