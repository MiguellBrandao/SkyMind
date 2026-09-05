import { describe, expect, it } from "vitest";
import { ALL_TOOLS, selectRelevantTools } from "./registry";

describe("selectRelevantTools", () => {
  it("always includes alwaysInclude tools regardless of the message", () => {
    const tools = selectRelevantTools("hello there", true);
    const names = tools.map((t) => t.name);
    expect(names).toContain("get_linked_account");
    expect(names).toContain("search_skyblock_knowledge");
  });

  it("selects bazaar tools for a price-related question", () => {
    const tools = selectRelevantTools("what's the bazaar price of enchanted lapis?", true);
    expect(tools.map((t) => t.name)).toContain("get_bazaar_price");
  });

  it("selects pet tools for a pet-related question", () => {
    const tools = selectRelevantTools("what pets do I have?", true);
    expect(tools.map((t) => t.name)).toContain("get_pets");
  });

  it("falls back to a small default core set for generic questions", () => {
    const tools = selectRelevantTools("how am I doing overall?", true);
    const names = tools.map((t) => t.name);
    expect(names).toContain("get_selected_profile");
  });

  it("adds get_player when the user has no linked account", () => {
    const tools = selectRelevantTools("random unrelated question", false);
    expect(tools.map((t) => t.name)).toContain("get_player");
  });

  it("never returns more tools than exist in the full registry", () => {
    const tools = selectRelevantTools("bazaar auction pets skills dungeons compare damage ehp analyze profile", true);
    expect(tools.length).toBeLessThanOrEqual(ALL_TOOLS.length);
    expect(new Set(tools.map((t) => t.name)).size).toBe(tools.length); // no duplicates
  });
});
