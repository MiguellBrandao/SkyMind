import Anthropic from "@anthropic-ai/sdk";
import { AiProviderError } from "../../utils/errors";
import { logger } from "../../utils/logger";
import type { AIProvider, ChatMessage, GenerateOptions, GenerateResult, ToolCall } from "./types";

type AnthropicContentBlockParam = Anthropic.Messages.TextBlockParam | Anthropic.Messages.ToolUseBlockParam | Anthropic.Messages.ToolResultBlockParam;

function toAnthropicMessages(messages: ChatMessage[]): Anthropic.Messages.MessageParam[] {
  const result: Anthropic.Messages.MessageParam[] = [];

  for (const msg of messages) {
    if (msg.role === "user") {
      result.push({ role: "user", content: msg.content });
      continue;
    }
    if (msg.role === "assistant") {
      const content: AnthropicContentBlockParam[] = [];
      if (msg.content) content.push({ type: "text", text: msg.content });
      for (const call of msg.toolCalls ?? []) {
        content.push({ type: "tool_use", id: call.id, name: call.name, input: call.arguments });
      }
      result.push({ role: "assistant", content });
      continue;
    }
    if (msg.role === "tool") {
      result.push({ role: "user", content: [{ type: "tool_result", tool_use_id: msg.toolCallId ?? "", content: msg.content }] });
    }
  }

  return result;
}

export class AnthropicProvider implements AIProvider {
  readonly id = "anthropic";
  private readonly client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    try {
      const tools = options.tools?.map((tool) => ({
        name: tool.name,
        description: tool.description,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        input_schema: tool.parameters as any,
      }));

      const response = await this.client.messages.create({
        model: options.model,
        system: options.systemPrompt,
        max_tokens: options.maxOutputTokens ?? 2048,
        temperature: options.temperature ?? 0.4,
        messages: toAnthropicMessages(options.messages),
        tools: tools && tools.length > 0 ? tools : undefined,
        tool_choice: options.forceToolName ? { type: "tool", name: options.forceToolName } : undefined,
      });

      const toolCalls: ToolCall[] = response.content
        .filter((block): block is Anthropic.Messages.ToolUseBlock => block.type === "tool_use")
        .map((block) => ({ id: block.id, name: block.name, arguments: block.input as Record<string, unknown> }));

      const text = response.content
        .filter((block): block is Anthropic.Messages.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("\n");

      return {
        content: text || null,
        toolCalls,
        finishReason: response.stop_reason === "tool_use" ? "tool_calls" : response.stop_reason === "max_tokens" ? "length" : "stop",
        usage: { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens },
      };
    } catch (err) {
      logger.error({ err }, "Anthropic generate() failed");
      throw new AiProviderError("Anthropic provider request failed", { cause: err });
    }
  }
}
