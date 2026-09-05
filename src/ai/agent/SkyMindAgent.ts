import { BASE_SYSTEM_PROMPT } from "../prompts/systemPrompt";
import type { ChatMessage, ToolCall, ToolDefinition } from "../providers/types";
import { resolveProviderForUser } from "../providers/ProviderFactory";
import { selectRelevantTools, TOOLS_BY_NAME } from "../tools/registry";
import type { AnyTool, ToolContext } from "../tools/types";
import { zodToJsonSchema } from "../tools/zodToJsonSchema";
import { AppError, toUserMessage } from "../../utils/errors";
import { logger } from "../../utils/logger";

const MAX_TOOL_ITERATIONS = 5;

/**
 * Matches recommendation/meta-style questions ("best setup for X", "bis gear", "meta build",
 * "best money making method", ...). Game meta shifts with updates and reforges/items the model's
 * training data won't reflect, and left to its own judgment the model sometimes skips
 * search_skyblock_knowledge entirely and answers from (possibly stale/wrong) memory instead -
 * confidently, with no indication it might be outdated. Forcing the search tool on the first turn
 * for these guarantees real, current source material is in context before the model answers.
 */
const RECOMMENDATION_PATTERN =
  /\b(best|bis|b\.i\.s\.?|meta|optimal|op)\b[^.!?\n]{0,60}\b(setup|build|loadout|gear|weapon|armou?r|class|pet|method|farm|route|strategy|reforge|enchant)\b|\b(setup|build|loadout)\b[^.!?\n]{0,30}\bfor\b|\bmoney[ -]?making\b/i;

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

  const shouldForceKnowledgeSearch = RECOMMENDATION_PATTERN.test(options.userMessage) && relevantTools.some((tool) => tool.name === "search_skyblock_knowledge");

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
    const forceToolName = iteration === 0 && shouldForceKnowledgeSearch ? "search_skyblock_knowledge" : undefined;
    const result = await provider.generate({ model, systemPrompt, messages, tools: toolDefinitions, forceToolName });

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
