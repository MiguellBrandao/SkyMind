import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockEnv } = vi.hoisted(() => ({ mockEnv: {} as Record<string, string> }));

vi.mock("../../config/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../config/env")>();
  Object.assign(mockEnv, actual.env);
  return { env: mockEnv };
});

import { isRedditConfigured, searchReddit } from "./redditSearch";

describe("isRedditConfigured", () => {
  it("is false when either credential is missing", () => {
    mockEnv.REDDIT_CLIENT_ID = "";
    mockEnv.REDDIT_CLIENT_SECRET = "";
    expect(isRedditConfigured()).toBe(false);

    mockEnv.REDDIT_CLIENT_ID = "id";
    mockEnv.REDDIT_CLIENT_SECRET = "";
    expect(isRedditConfigured()).toBe(false);
  });

  it("is true when both credentials are set", () => {
    mockEnv.REDDIT_CLIENT_ID = "id";
    mockEnv.REDDIT_CLIENT_SECRET = "secret";
    expect(isRedditConfigured()).toBe(true);
  });
});

describe("searchReddit", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    mockEnv.REDDIT_CLIENT_ID = "";
    mockEnv.REDDIT_CLIENT_SECRET = "";
    global.fetch = originalFetch;
  });

  it("returns an empty array without calling the network when not configured", async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;

    const results = await searchReddit("magical power");

    expect(results).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("fetches an OAuth token then returns parsed search results when configured", async () => {
    mockEnv.REDDIT_CLIENT_ID = "id";
    mockEnv.REDDIT_CLIENT_SECRET = "secret";

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: "tok", expires_in: 3600 }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { children: [{ data: { title: "Best reforge for Hyperion?", permalink: "/r/HypixelSkyblock/comments/abc", selftext: "Discuss", score: 42 } }] },
        }),
      });
    global.fetch = fetchMock as unknown as typeof fetch;

    const results = await searchReddit("hyperion reforge", 3);

    expect(results).toEqual([
      { title: "Best reforge for Hyperion?", url: "https://www.reddit.com/r/HypixelSkyblock/comments/abc", selftext: "Discuss", score: 42 },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns an empty array when the search request fails", async () => {
    mockEnv.REDDIT_CLIENT_ID = "id";
    mockEnv.REDDIT_CLIENT_SECRET = "secret";

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: "tok", expires_in: 3600 }) })
      .mockResolvedValueOnce({ ok: false, status: 500 });
    global.fetch = fetchMock as unknown as typeof fetch;

    const results = await searchReddit("anything");
    expect(results).toEqual([]);
  });
});
