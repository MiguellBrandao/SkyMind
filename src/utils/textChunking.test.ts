import { describe, expect, it } from "vitest";
import { chunkMessageText } from "./textChunking";

describe("chunkMessageText", () => {
  it("returns the text as a single chunk when it fits", () => {
    expect(chunkMessageText("short reply")).toEqual(["short reply"]);
  });

  it("splits long text into multiple chunks, none exceeding the limit", () => {
    const text = Array.from({ length: 50 }, (_, i) => `This is paragraph number ${i} with some extra padding text to make it longer.`).join("\n\n");
    const chunks = chunkMessageText(text, 200);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(200);
    }
  });

  it("never drops content: rejoining chunks reconstructs the original text (modulo trimmed boundaries)", () => {
    const text = Array.from({ length: 20 }, (_, i) => `Line ${i}`).join("\n");
    const chunks = chunkMessageText(text, 30);
    const rejoined = chunks.join("\n");
    for (let i = 0; i < 20; i++) {
      expect(rejoined).toContain(`Line ${i}`);
    }
  });

  it("prefers splitting on paragraph breaks over hard cuts", () => {
    const text = `${"a".repeat(50)}\n\n${"b".repeat(50)}`;
    const chunks = chunkMessageText(text, 60);
    expect(chunks[0]).toBe("a".repeat(50));
    expect(chunks[1]).toBe("b".repeat(50));
  });

  it("caps the number of chunks instead of flooding the channel", () => {
    const text = "word ".repeat(20_000);
    const chunks = chunkMessageText(text, 100);
    expect(chunks.length).toBeLessThanOrEqual(6);
  });
});
