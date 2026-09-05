import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, string>();

vi.mock("../../services/redisClient", () => ({
  redis: {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    set: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
      return "OK";
    }),
    del: vi.fn(async (key: string) => {
      store.delete(key);
      return 1;
    }),
  },
}));

import { getOrSetCache, invalidateCache } from "./cachedFetch";

describe("getOrSetCache", () => {
  beforeEach(() => {
    store.clear();
  });

  it("calls the fetcher on a cache miss and stores the result", async () => {
    const fetcher = vi.fn(async () => ({ value: 42 }));
    const result = await getOrSetCache("test:key", 60, fetcher);
    expect(result).toEqual({ value: 42 });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(store.get("test:key")).toBe(JSON.stringify({ value: 42 }));
  });

  it("returns the cached value without calling the fetcher again on a hit", async () => {
    const fetcher = vi.fn(async () => ({ value: 1 }));
    await getOrSetCache("test:key", 60, fetcher);
    await getOrSetCache("test:key", 60, fetcher);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("deduplicates concurrent in-flight requests for the same key", async () => {
    let callCount = 0;
    const fetcher = vi.fn(async () => {
      callCount++;
      await new Promise((resolve) => setTimeout(resolve, 20));
      return { callCount };
    });

    const [a, b] = await Promise.all([getOrSetCache("dedupe:key", 60, fetcher), getOrSetCache("dedupe:key", 60, fetcher)]);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(a).toEqual(b);
  });

  it("invalidateCache removes the stored value", async () => {
    await getOrSetCache("to-remove", 60, async () => "value");
    await invalidateCache("to-remove");
    expect(store.has("to-remove")).toBe(false);
  });
});
