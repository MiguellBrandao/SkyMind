import type { z } from "zod";
import type { LinkedAccount } from "../../database/schema";

export interface ToolContext {
  discordUserId: string;
  linkedAccount?: LinkedAccount | undefined;
}

export interface ToolDefinitionWithHandler<Schema extends z.ZodTypeAny = z.ZodTypeAny> {
  name: string;
  description: string;
  schema: Schema;
  handler: (args: z.infer<Schema>, ctx: ToolContext) => Promise<unknown>;
}

export function defineTool<Schema extends z.ZodTypeAny>(tool: ToolDefinitionWithHandler<Schema>): ToolDefinitionWithHandler<Schema> {
  return tool;
}

/**
 * Type-erased form of a tool, used for heterogeneous collections (the tool registry). Safe
 * despite the `any` args because every call site re-validates arguments via `tool.schema.parse()`
 * before ever invoking `handler` - see SkyMindAgent's executeTool().
 */
export interface AnyTool {
  name: string;
  description: string;
  schema: z.ZodTypeAny;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (args: any, ctx: ToolContext) => Promise<unknown>;
}
