import { GoogleGenAI, type Content, type FunctionDeclaration, type Part } from "@google/genai";
import { AiProviderError } from "../../utils/errors";
import { logger } from "../../utils/logger";
import type { AIProvider, ChatMessage, GenerateOptions, GenerateResult, JsonSchema, ToolCall, ToolDefinition } from "./types";

function toGeminiFunctionDeclarations(tools: ToolDefinition[]): FunctionDeclaration[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    // The current Gemini API (@google/genai) accepts a plain JSON Schema directly via
    // parametersJsonSchema - no more translation to Google's uppercase-typed Schema format.
    parametersJsonSchema: tool.parameters as JsonSchema,
  }));
}

function toGeminiContents(messages: ChatMessage[]): Content[] {
  return messages.map((msg): Content => {
    if (msg.role === "user") {
      return { role: "user", parts: [{ text: msg.content }] };
    }
    if (msg.role === "tool") {
      let responseObj: Record<string, unknown>;
      try {
        responseObj = JSON.parse(msg.content) as Record<string, unknown>;
      } catch {
        responseObj = { result: msg.content };
      }
      // Function responses are sent back as role "user" per the current API contract (Content.role
      // only accepts 'user' | 'model').
      return { role: "user", parts: [{ functionResponse: { name: msg.name ?? "tool", response: responseObj } }] };
    }
    // assistant
    const parts: Part[] = [];
    if (msg.content) parts.push({ text: msg.content });
    for (const call of msg.toolCalls ?? []) {
      parts.push({ functionCall: { name: call.name, args: call.arguments } });
    }
    return { role: "model", parts: parts.length > 0 ? parts : [{ text: "" }] };
  });
}

export class GeminiProvider implements AIProvider {
  readonly id = "gemini";
  private readonly client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    try {
      const tools =
        options.tools && options.tools.length > 0 ? [{ functionDeclarations: toGeminiFunctionDeclarations(options.tools) }] : undefined;

      const response = await this.client.models.generateContent({
        model: options.model,
        contents: toGeminiContents(options.messages),
        config: {
          systemInstruction: options.systemPrompt,
          tools,
          temperature: options.temperature ?? 0.4,
          maxOutputTokens: options.maxOutputTokens ?? 2048,
        },
      });

      const functionCalls = response.functionCalls ?? [];
      const toolCalls: ToolCall[] = functionCalls.map((call, index) => ({
        id: call.id ?? `${call.name ?? "tool"}-${index}-${Date.now()}`,
        name: call.name ?? "",
        arguments: (call.args as Record<string, unknown>) ?? {},
      }));

      const text = response.text ?? "";

      return {
        content: text || null,
        toolCalls,
        finishReason: toolCalls.length > 0 ? "tool_calls" : "stop",
        usage: response.usageMetadata
          ? { inputTokens: response.usageMetadata.promptTokenCount, outputTokens: response.usageMetadata.candidatesTokenCount }
          : undefined,
      };
    } catch (err) {
      logger.error({ err }, "Gemini generate() failed");
      throw new AiProviderError("Gemini provider request failed", { cause: err });
    }
  }
}
