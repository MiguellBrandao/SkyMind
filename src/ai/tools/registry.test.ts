import { describe, expect, it } from "vitest";
import { ALL_TOOLS, TOOLS_BY_NAME } from "./registry";

describe("ALL_TOOLS", () => {
  it("includes the core account and knowledge tools", () => {
    const names = ALL_TOOLS.map((t) => t.name);
    expect(names).toContain("get_linked_account");
    expect(names).toContain("search_skyblock_knowledge");
  });

  it("has no duplicate tool names", () => {
    const names = ALL_TOOLS.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("is indexed by name in TOOLS_BY_NAME", () => {
    for (const tool of ALL_TOOLS) {
      expect(TOOLS_BY_NAME.get(tool.name)).toBe(tool);
    }
  });
});
