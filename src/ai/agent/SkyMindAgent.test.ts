import { beforeEach, describe, expect, it, vi } from "vitest";

// A duck-typed stand-in for a Zod schema (just needs .parse()) - referencing the real `zod`
// import from inside vi.hoisted() isn't safe, since vi.hoisted runs before imports initialize.
const { mockGenerate, fakeTool } = vi.hoisted(() => {
  const tool = {
    name: "fake_tool",
    description: "A fake tool",
    schema: { parse: (args: unknown) => args },
    handler: vi.fn(async () => ({ result: "tool-output" })),
  };
  return { mockGenerate: vi.fn(), fakeTool: tool };
});

vi.mock("../providers/ProviderFactory", () => ({
  resolveProviderForUser: vi.fn(async () => ({ provider: { id: "fake", generate: mockGenerate }, model: "fake-model" })),
}));

vi.mock("../tools/registry", () => ({
  ALL_TOOLS: [fakeTool],
  TOOLS_BY_NAME: new Map([["fake_tool", fakeTool]]),
}));

import { runAgent } from "./SkyMindAgent";

describe("runAgent", () => {
  beforeEach(() => {
    mockGenerate.mockReset();
    fakeTool.handler.mockReset();
    fakeTool.handler.mockResolvedValue({ result: "tool-output" });
  });

  it("returns the final content directly when the model doesn't request tool calls", async () => {
    mockGenerate.mockResolvedValueOnce({ content: "Hello!", toolCalls: [], finishReason: "stop" });

    const result = await runAgent({ discordUserId: "u1", userMessage: "hi", history: [], toolContext: { discordUserId: "u1" } });

    expect(result.reply).toBe("Hello!");
    expect(result.toolsUsed).toEqual([]);
    expect(result.providerId).toBe("fake");
  });

  it("executes a requested tool call and feeds the result back for a final answer", async () => {
    mockGenerate
      .mockResolvedValueOnce({ content: null, toolCalls: [{ id: "call1", name: "fake_tool", arguments: {} }], finishReason: "tool_calls" })
      .mockResolvedValueOnce({ content: "Done using the tool.", toolCalls: [], finishReason: "stop" });

    const result = await runAgent({ discordUserId: "u1", userMessage: "use the tool", history: [], toolContext: { discordUserId: "u1" } });

    expect(fakeTool.handler).toHaveBeenCalledTimes(1);
    expect(result.toolsUsed).toEqual(["fake_tool"]);
    expect(result.reply).toBe("Done using the tool.");
  });

  it("stops after the max tool-call iterations and returns a fallback message", async () => {
    mockGenerate.mockResolvedValue({ content: null, toolCalls: [{ id: "callX", name: "fake_tool", arguments: {} }], finishReason: "tool_calls" });

    const result = await runAgent({ discordUserId: "u1", userMessage: "loop forever", history: [], toolContext: { discordUserId: "u1" } });

    expect(result.reply).toMatch(/ran out of steps/i);
  });

  it("returns a structured error to the model instead of throwing when a tool handler fails", async () => {
    fakeTool.handler.mockRejectedValueOnce(new Error("boom"));
    mockGenerate
      .mockResolvedValueOnce({ content: null, toolCalls: [{ id: "call1", name: "fake_tool", arguments: {} }], finishReason: "tool_calls" })
      .mockResolvedValueOnce({ content: "Handled the error gracefully.", toolCalls: [], finishReason: "stop" });

    const result = await runAgent({ discordUserId: "u1", userMessage: "use the tool", history: [], toolContext: { discordUserId: "u1" } });

    expect(result.reply).toBe("Handled the error gracefully.");
  });

  it("returns 'unknown tool' output rather than crashing when the model hallucinates a tool name", async () => {
    mockGenerate
      .mockResolvedValueOnce({ content: null, toolCalls: [{ id: "call1", name: "not_a_real_tool", arguments: {} }], finishReason: "tool_calls" })
      .mockResolvedValueOnce({ content: "Fallback answer.", toolCalls: [], finishReason: "stop" });

    const result = await runAgent({ discordUserId: "u1", userMessage: "hi", history: [], toolContext: { discordUserId: "u1" } });

    expect(result.reply).toBe("Fallback answer.");
    expect(fakeTool.handler).not.toHaveBeenCalled();
  });

  it("tells the model the calling user's linked IGN so it doesn't need to ask for it", async () => {
    mockGenerate.mockResolvedValueOnce({ content: "answer", toolCalls: [], finishReason: "stop" });

    const linkedAccount = { minecraftUsername: "Kiwi123" } as never;
    await runAgent({ discordUserId: "u1", userMessage: "best setup for m6 bers", history: [], toolContext: { discordUserId: "u1", linkedAccount } });

    const [callArgs] = mockGenerate.mock.calls[0] as [{ systemPrompt: string }];
    expect(callArgs.systemPrompt).toContain("Kiwi123");
  });

  it("tells the model when the calling user is not linked", async () => {
    mockGenerate.mockResolvedValueOnce({ content: "answer", toolCalls: [], finishReason: "stop" });

    await runAgent({ discordUserId: "u1", userMessage: "best setup for m6 bers", history: [], toolContext: { discordUserId: "u1" } });

    const [callArgs] = mockGenerate.mock.calls[0] as [{ systemPrompt: string }];
    expect(callArgs.systemPrompt).toContain("not linked");
  });

  it("forces search_skyblock_knowledge on the first turn but not on later turns, regardless of the message", async () => {
    mockGenerate
      .mockResolvedValueOnce({ content: null, toolCalls: [{ id: "call1", name: "fake_tool", arguments: {} }], finishReason: "tool_calls" })
      .mockResolvedValueOnce({ content: "Done using the tool.", toolCalls: [], finishReason: "stop" });

    await runAgent({ discordUserId: "u1", userMessage: "hi", history: [], toolContext: { discordUserId: "u1" } });

    const [firstCallArgs] = mockGenerate.mock.calls[0] as [{ forceToolName?: string }];
    const [secondCallArgs] = mockGenerate.mock.calls[1] as [{ forceToolName?: string }];
    expect(firstCallArgs.forceToolName).toBe("search_skyblock_knowledge");
    expect(secondCallArgs.forceToolName).toBeUndefined();
  });
});
