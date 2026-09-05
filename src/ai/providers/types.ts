export type ChatRole = "system" | "user" | "assistant" | "tool";

export interface ChatMessage {
  role: ChatRole;
  content: string;
  /** Present when role === "tool": which tool call this message is a result for. */
  toolCallId?: string;
  /** Present when role === "tool": the tool's name. */
  name?: string;
  /** Present when role === "assistant" and the assistant requested tool calls in this turn. */
  toolCalls?: ToolCall[];
}

export interface JsonSchema {
  type?: string;
  description?: string;
  enum?: (string | number)[];
  items?: JsonSchema;
  properties?: Record<string, JsonSchema>;
  required?: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: JsonSchema;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface GenerateOptions {
  model: string;
  systemPrompt: string;
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  /** "required" forces the model to call some tool this turn instead of replying with text - which one is still its choice. Defaults to "auto". */
  toolChoice?: "auto" | "required";
  maxOutputTokens?: number;
  temperature?: number;
}

export interface GenerateUsage {
  inputTokens?: number;
  outputTokens?: number;
}

export interface GenerateResult {
  content: string | null;
  toolCalls: ToolCall[];
  finishReason: "stop" | "tool_calls" | "length" | "error";
  usage?: GenerateUsage;
}

export interface AIProvider {
  readonly id: string;
  generate(options: GenerateOptions): Promise<GenerateResult>;
}
