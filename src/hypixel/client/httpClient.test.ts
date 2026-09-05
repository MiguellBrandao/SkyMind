import { afterEach, describe, expect, it, vi } from "vitest";
import { HypixelApiError, HypixelRateLimitError } from "../../utils/errors";
import { hypixelRequest } from "./httpClient";

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
}

describe("hypixelRequest", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns parsed JSON on a successful response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(200, { success: true, value: 1 })),
    );
    const result = await hypixelRequest<{ success: boolean; value: number }>("player", { uuid: "abc" });
    expect(result).toEqual({ success: true, value: 1 });
  });

  it("retries once on 429 and succeeds on the next attempt", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(429, { success: false }, { "retry-after": "0" }))
      .mockResolvedValueOnce(jsonResponse(200, { success: true }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await hypixelRequest<{ success: boolean }>("player", { uuid: "abc" });
    expect(result).toEqual({ success: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws HypixelRateLimitError when 429 persists past max retries", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(429, { success: false }, { "retry-after": "0" })),
    );
    await expect(hypixelRequest("player", { uuid: "abc" })).rejects.toBeInstanceOf(HypixelRateLimitError);
  }, 10_000);

  it("throws immediately on 403 without retrying", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(403, { success: false }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(hypixelRequest("player", { uuid: "abc" })).rejects.toBeInstanceOf(HypixelApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries on 5xx and eventually throws after exhausting retries", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("server error", { status: 500 })),
    );
    await expect(hypixelRequest("player", { uuid: "abc" })).rejects.toBeInstanceOf(HypixelApiError);
  }, 10_000);
});
