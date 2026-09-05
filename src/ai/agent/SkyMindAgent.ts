import { BASE_SYSTEM_PROMPT } from "../prompts/systemPrompt";
import type { ChatMessage, ToolCall, ToolDefinition } from "../providers/types";
import { resolveProviderForUser } from "../providers/ProviderFactory";
import { selectRelevantTools, TOOLS_BY_NAME } from "../tools/registry";
import type { AnyTool, ToolContext } from "../tools/types";
import { zodToJsonSchema } from "../tools/zodToJsonSchema";
import { AppError, toUserMessage } from "../../utils/errors";
import { logger } from "../../utils/logger";

const MAX_TOOL_ITERATIONS = 5;

export interface AgentRunOptions {
  discordUserId: string;
  userMessage: string;
  history: ChatMessage[];
  toolContext: ToolContext;
}

export interface AgentRunResult {
  reply: string;
  toolsUsed: string[];
  providerId: string;
  model: string;
}

async function executeTool(call: ToolCall, availableTools: AnyTool[], ctx: ToolContext): Promise<unknown> {
  const tool = availableTools.find((t) => t.name === call.name) ?? TOOLS_BY_NAME.get(call.name);
  if (!tool) {
    return { error: true, message: `Unknown tool: ${call.name}` };
  }

  try {
    const parsedArgs = tool.schema.parse(call.arguments);
    return await tool.handler(parsedArgs, ctx);
  } catch (err) {
    if (err instanceof AppError) {
      logger.info({ tool: call.name, code: err.code }, "Tool call failed with a handled error");
      return { error: true, code: err.code, message: err.userMessage };
    }
    logger.error({ err, tool: call.name }, "Tool call failed unexpectedly");
    return { error: true, message: toUserMessage(err) };
  }
}

/**
 * Runs SkyMind's tool-calling agent loop: generate -> (if tool calls) execute -> feed results
 * back -> generate again, up to MAX_TOOL_ITERATIONS, then returns the final natural-language reply.
 */
export async function runAgent(options: AgentRunOptions): Promise<AgentRunResult> {
  const { provider, model } = await resolveProviderForUser(options.discordUserId);
  const systemPrompt = BASE_SYSTEM_PROMPT;

  const relevantTools = selectRelevantTools(options.userMessage, Boolean(options.toolContext.linkedAccount));
  const toolDefinitions: ToolDefinition[] = relevantTools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: zodToJsonSchema(tool.schema),
  }));

  const messages: ChatMessage[] = [...options.history, { role: "user", content: options.userMessage }];
  const toolsUsed: string[] = [];

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
    const result = await provider.generate({ model, systemPrompt, messages, tools: toolDefinitions });

    if (result.finishReason !== "tool_calls" || result.toolCalls.length === 0) {
      return {
        reply: result.content?.trim() || "I don't have a response for that - could you rephrase your question?",
        toolsUsed,
        providerId: provider.id,
        model,
      };
    }

    messages.push({ role: "assistant", content: result.content ?? "", toolCalls: result.toolCalls });

    for (const call of result.toolCalls) {
      toolsUsed.push(call.name);
      const output = await executeTool(call, relevantTools, options.toolContext);
      messages.push({ role: "tool", content: JSON.stringify(output), toolCallId: call.id, name: call.name });
    }
  }

  logger.warn({ discordUserId: options.discordUserId, toolsUsed }, "Agent hit max tool iterations without a final answer");
  return {
    reply: "I gathered a lot of data but ran out of steps to fully answer that - could you narrow down the question?",
    toolsUsed,
    providerId: provider.id,
    model,
  };
}
