import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { AiProviderError } from "../../utils/errors";
import { logger } from "../../utils/logger";
import type { AIProvider, ChatMessage, GenerateOptions, GenerateResult, JsonSchema, ToolCall, ToolDefinition } from "./types";

const GEMINI_TYPE_MAP: Record<string, SchemaType> = {
  object: SchemaType.OBJECT,
  string: SchemaType.STRING,
  number: SchemaType.NUMBER,
  boolean: SchemaType.BOOLEAN,
  array: SchemaType.ARRAY,
};

function toGeminiSchema(schema: JsonSchema): Record<string, unknown> {
  const result: Record<string, unknown> = { type: GEMINI_TYPE_MAP[schema.type ?? "string"] ?? SchemaType.STRING };
  if (schema.description) result.description = schema.description;
  if (schema.enum) result.enum = schema.enum.map(String);
  if (schema.items) result.items = toGeminiSchema(schema.items);
  if (schema.properties) {
    result.properties = Object.fromEntries(Object.entries(schema.properties).map(([key, value]) => [key, toGeminiSchema(value)]));
  }
  if (schema.required) result.required = schema.required;
  return result;
}

function toGeminiFunctionDeclarations(tools: ToolDefinition[]) {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: toGeminiSchema(tool.parameters),
  }));
}

function toGeminiContents(messages: ChatMessage[]) {
  return messages.map((msg) => {
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
      return { role: "function", parts: [{ functionResponse: { name: msg.name ?? "tool", response: responseObj } }] };
    }
    // assistant
    const parts: Record<string, unknown>[] = [];
    if (msg.content) parts.push({ text: msg.content });
    for (const call of msg.toolCalls ?? []) {
      parts.push({ functionCall: { name: call.name, args: call.arguments } });
    }
    return { role: "model", parts: parts.length > 0 ? parts : [{ text: "" }] };
  });
}

export class GeminiProvider implements AIProvider {
  readonly id = "gemini";
  private readonly client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    try {
      const model = this.client.getGenerativeModel({
        model: options.model,
        systemInstruction: options.systemPrompt,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tools: options.tools && options.tools.length > 0 ? ([{ functionDeclarations: toGeminiFunctionDeclarations(options.tools) }] as any) : undefined,
        generationConfig: {
          temperature: options.temperature ?? 0.4,
          maxOutputTokens: options.maxOutputTokens ?? 2048,
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contents = toGeminiContents(options.messages) as any;
      const result = await model.generateContent({ contents });
      const response = result.response;

      const functionCalls = response.functionCalls() ?? [];
      const toolCalls: ToolCall[] = functionCalls.map((call, index) => ({
        id: `${call.name}-${index}-${Date.now()}`,
        name: call.name,
        arguments: (call.args as Record<string, unknown>) ?? {},
      }));

      const text = (() => {
        try {
          return response.text();
        } catch {
          return "";
        }
      })();

      const usage = response.usageMetadata
        ? { inputTokens: response.usageMetadata.promptTokenCount, outputTokens: response.usageMetadata.candidatesTokenCount }
        : undefined;

      return {
        content: text || null,
        toolCalls,
        finishReason: toolCalls.length > 0 ? "tool_calls" : "stop",
        usage,
      };
    } catch (err) {
      logger.error({ err }, "Gemini generate() failed");
      throw new AiProviderError("Gemini provider request failed", { cause: err });
    }
  }

  async embed(texts: string[]): Promise<number[][]> {
    try {
      const model = this.client.getGenerativeModel({ model: "text-embedding-004" });
      const results = await Promise.all(texts.map((text) => model.embedContent(text)));
      return results.map((r) => r.embedding.values);
    } catch (err) {
      logger.error({ err }, "Gemini embed() failed");
      throw new AiProviderError("Gemini embedding request failed", { cause: err });
    }
  }
}
