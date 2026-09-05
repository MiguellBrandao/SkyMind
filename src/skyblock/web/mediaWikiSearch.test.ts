import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSafeFetch } = vi.hoisted(() => ({ mockSafeFetch: vi.fn() }));

vi.mock("./safeFetch", () => ({ safeFetch: mockSafeFetch }));

import { searchMediaWiki, WIKI_SOURCES } from "./mediaWikiSearch";

const hypixelWiki = WIKI_SOURCES.find((s) => s.id === "hypixel_wiki")!;

describe("searchMediaWiki", () => {
  beforeEach(() => {
    mockSafeFetch.mockReset();
  });

  it("parses search hits and builds article URLs from the source's base URL/path", async () => {
    mockSafeFetch.mockResolvedValue(
      JSON.stringify({
        query: { search: [{ title: "Magical Power", snippet: "Increases with <b>Accessory</b> rarity" }] },
      }),
    );

    const hits = await searchMediaWiki(hypixelWiki, "magical power", 3);

    expect(hits).toEqual([
      {
        title: "Magical Power",
        url: "https://hypixelskyblock.minecraft.wiki/w/Magical_Power",
        snippet: "Increases with Accessory rarity",
      },
    ]);
  });

  it("requests the configured limit and query via the search API", async () => {
    mockSafeFetch.mockResolvedValue(JSON.stringify({ query: { search: [] } }));

    await searchMediaWiki(hypixelWiki, "catacombs floor 7", 5);

    const [requestedUrlString, requestedAccept] = mockSafeFetch.mock.calls[0] as [string, string];
    const requestedUrl = new URL(requestedUrlString);
    expect(requestedUrl.searchParams.get("srsearch")).toBe("catacombs floor 7");
    expect(requestedUrl.searchParams.get("srlimit")).toBe("5");
    expect(requestedAccept).toBe("application/json");
  });

  it("returns an empty array when the API has no search results", async () => {
    mockSafeFetch.mockResolvedValue(JSON.stringify({ query: {} }));
    const hits = await searchMediaWiki(hypixelWiki, "nonexistent thing", 3);
    expect(hits).toEqual([]);
  });
});
