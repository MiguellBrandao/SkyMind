import { OpenAIProvider } from "./OpenAIProvider";

/**
 * Thin wrapper around OpenAIProvider for any self-hosted or third-party endpoint that
 * implements the OpenAI Chat Completions API shape (LM Studio, vLLM, OpenRouter, Groq, etc.).
 * Requires an explicit baseURL since there's no sensible default.
 */
export class OpenAICompatibleProvider extends OpenAIProvider {
  override readonly id = "custom";

  constructor(apiKey: string, baseURL: string) {
    if (!baseURL) {
      throw new Error("OpenAICompatibleProvider requires a baseURL");
    }
    super(apiKey, baseURL);
  }
}
