import { describe, expect, it } from "vitest";
import { chunkText } from "./chunker";

describe("chunkText", () => {
  it("returns a single chunk for short text", () => {
    const chunks = chunkText("Line one.\nLine two.\nLine three.");
    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.content).toContain("Line one.");
  });

  it("splits long text into multiple chunks respecting chunkSize", () => {
    const lines = Array.from({ length: 50 }, (_, i) => `This is line number ${i} with some extra padding text to add length.`);
    const chunks = chunkText(lines.join("\n"), { chunkSize: 500, overlap: 50 });
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.content.length).toBeLessThanOrEqual(600); // chunkSize + a line + overlap slack
    }
  });

  it("drops empty lines and very short leftover fragments", () => {
    const chunks = chunkText("\n\n   \nReal content line that is long enough to keep.\n\n");
    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.content).toBe("Real content line that is long enough to keep.");
  });

  it("returns no chunks for empty input", () => {
    expect(chunkText("")).toHaveLength(0);
  });
});
