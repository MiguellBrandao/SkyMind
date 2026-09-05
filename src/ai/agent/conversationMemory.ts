import { conversationRepository } from "../../database/repositories/conversationRepository";
import { userSettingsRepository } from "../../database/repositories/userSettingsRepository";
import type { ChatMessage } from "../providers/types";
import type { UserMemory } from "../prompts/systemPrompt";

export interface ConversationContext {
  messages: ChatMessage[];
  memory: UserMemory;
}

/**
 * Loads prior turns as plain user/assistant text (never persisted tool calls or raw API dumps -
 * see recordTurn) plus lightweight remembered preferences. Live account data is intentionally
 * NOT cached here; the agent always re-fetches it via tools on every turn.
 */
export async function loadConversationContext(discordUserId: string): Promise<ConversationContext> {
  const [history, settings] = await Promise.all([conversationRepository.getRecent(discordUserId), userSettingsRepository.find(discordUserId)]);

  const messages: ChatMessage[] = history.map((m) => ({ role: m.role === "tool" ? "assistant" : m.role, content: m.content }));

  return {
    messages,
    memory: {
      preferredClass: settings?.preferredClass ?? null,
      goals: settings?.goals ?? null,
      budget: settings?.budget ?? null,
    },
  };
}

export async function recordTurn(discordUserId: string, userMessage: string, assistantReply: string): Promise<void> {
  await conversationRepository.append(discordUserId, "user", userMessage);
  await conversationRepository.append(discordUserId, "assistant", assistantReply);
}
