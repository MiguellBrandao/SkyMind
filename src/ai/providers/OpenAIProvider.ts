import OpenAI from "openai";
import { AiProviderError } from "../../utils/errors";
import { logger } from "../../utils/logger";
import { safeJsonParse } from "./shared";
import type { AIProvider, ChatMessage, GenerateOptions, GenerateResult, ToolCall } from "./types";

function toOpenAIMessage(msg: ChatMessage): OpenAI.Chat.Completions.ChatCompletionMessageParam {
  if (msg.role === "tool") {
    return { role: "tool", tool_call_id: msg.toolCallId ?? "", content: msg.content };
  }
  if (msg.role === "assistant") {
    return {
      role: "assistant",
      content: msg.content || null,
      tool_calls: msg.toolCalls?.map((call) => ({
        id: call.id,
        type: "function" as const,
        function: { name: call.name, arguments: JSON.stringify(call.arguments) },
      })),
    };
  }
  return { role: "user", content: msg.content };
}

export class OpenAIProvider implements AIProvider {
  readonly id: string = "openai";
  protected readonly client: OpenAI;

  constructor(apiKey: string, baseURL?: string) {
    this.client = new OpenAI({ apiKey, baseURL });
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    try {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: options.systemPrompt },
        ...options.messages.map(toOpenAIMessage),
      ];

      const tools = options.tools?.map((tool) => ({
        type: "function" as const,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function: { name: tool.name, description: tool.description, parameters: tool.parameters as any },
      }));

      const response = await this.client.chat.completions.create({
        model: options.model,
        messages,
        tools: tools && tools.length > 0 ? tools : undefined,
        temperature: options.temperature ?? 0.4,
        max_tokens: options.maxOutputTokens ?? 2048,
      });

      const choice = response.choices[0];
      const toolCalls: ToolCall[] = (choice?.message.tool_calls ?? []).map((call) => ({
        id: call.id,
        name: call.function.name,
        arguments: safeJsonParse(call.function.arguments),
      }));

      return {
        content: choice?.message.content ?? null,
        toolCalls,
        finishReason: toolCalls.length > 0 ? "tool_calls" : choice?.finish_reason === "length" ? "length" : "stop",
        usage: response.usage ? { inputTokens: response.usage.prompt_tokens, outputTokens: response.usage.completion_tokens } : undefined,
      };
    } catch (err) {
      logger.error({ err }, `${this.id} generate() failed`);
      throw new AiProviderError(`${this.id} provider request failed`, { cause: err });
    }
  }

  async embed(texts: string[]): Promise<number[][]> {
    try {
      const response = await this.client.embeddings.create({ model: "text-embedding-3-small", input: texts });
      return response.data.map((d) => d.embedding);
    } catch (err) {
      logger.error({ err }, `${this.id} embed() failed`);
      throw new AiProviderError(`${this.id} embedding request failed`, { cause: err });
    }
  }
}
