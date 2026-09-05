import { aiConfig } from "../../config";
import { userSettingsRepository } from "../../database/repositories/userSettingsRepository";
import { decryptSecret } from "../../utils/crypto";
import { AiProviderError } from "../../utils/errors";
import { AnthropicProvider } from "./AnthropicProvider";
import { GeminiProvider } from "./GeminiProvider";
import { OpenAICompatibleProvider } from "./OpenAICompatibleProvider";
import { OpenAIProvider } from "./OpenAIProvider";
import type { AIProvider } from "./types";

export interface ResolvedProvider {
  provider: AIProvider;
  model: string;
  isUserProvided: boolean;
}

function defaultModelFor(provider: string): string {
  switch (provider) {
    case "gemini":
      return "gemini-2.5-flash";
    case "openai":
      return "gpt-4o-mini";
    case "anthropic":
      return "claude-sonnet-5";
    default:
      return aiConfig.defaultModel;
  }
}

function buildDefaultProvider(): AIProvider {
  switch (aiConfig.defaultProvider) {
    case "openai":
      return new OpenAIProvider(aiConfig.openaiApiKey || aiConfig.defaultApiKey);
    case "anthropic":
      return new AnthropicProvider(aiConfig.anthropicApiKey || aiConfig.defaultApiKey);
    case "gemini":
    default:
      return new GeminiProvider(aiConfig.defaultApiKey);
  }
}

/** Resolves the AIProvider to use for a given Discord user: their own configured key, or the app default. */
export async function resolveProviderForUser(discordUserId: string): Promise<ResolvedProvider> {
  const settings = await userSettingsRepository.find(discordUserId);

  if (!settings || settings.aiProvider === "default" || !settings.encryptedApiKey) {
    return { provider: buildDefaultProvider(), model: aiConfig.defaultModel, isUserProvided: false };
  }

  let apiKey: string;
  try {
    apiKey = decryptSecret(settings.encryptedApiKey);
  } catch (err) {
    throw new AiProviderError("Failed to decrypt stored API key", {
      cause: err,
      userMessage: "Your saved AI API key could not be read. Please reconfigure it via `/settings ai`.",
    });
  }

  const model = settings.aiModel || defaultModelFor(settings.aiProvider);

  switch (settings.aiProvider) {
    case "gemini":
      return { provider: new GeminiProvider(apiKey), model, isUserProvided: true };
    case "openai":
      return { provider: new OpenAIProvider(apiKey), model, isUserProvided: true };
    case "anthropic":
      return { provider: new AnthropicProvider(apiKey), model, isUserProvided: true };
    case "custom":
      if (!settings.customBaseUrl) {
        throw new AiProviderError("Custom provider missing base URL", {
          userMessage: "Your custom AI provider is missing a base URL. Please reconfigure it via `/settings ai`.",
        });
      }
      return { provider: new OpenAICompatibleProvider(apiKey, settings.customBaseUrl), model, isUserProvided: true };
    default:
      return { provider: buildDefaultProvider(), model: aiConfig.defaultModel, isUserProvided: false };
  }
}

/** Provider used exclusively for generating knowledge-base embeddings (ingestion + retrieval). */
export function getEmbeddingProvider(): AIProvider {
  switch (aiConfig.embeddingProvider) {
    case "openai":
      return new OpenAIProvider(aiConfig.openaiApiKey || aiConfig.defaultApiKey);
    case "gemini":
    default:
      return new GeminiProvider(aiConfig.defaultApiKey);
  }
}
