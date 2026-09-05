import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlayerNotFoundError } from "../../utils/errors";

vi.mock("../cache/cachedFetch", () => ({
  getOrSetCache: vi.fn(async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => fetcher()),
}));

import { resolveIgnToUuid } from "./mojangClient";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("resolveIgnToUuid", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves via Mojang when the API succeeds", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(200, { id: "abc123def4567890abc123def4567890", name: "Notch" }));
    const result = await resolveIgnToUuid("Notch");
    expect(result).toEqual({ uuid: "abc123def4567890abc123def4567890", username: "Notch" });
  });

  it("falls back to PlayerDB when Mojang returns 404", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(404, {}))
      .mockResolvedValueOnce(jsonResponse(200, { success: true, data: { player: { id: "fedcba9876543210fedcba9876543210", username: "Herobrine" } } }));

    const result = await resolveIgnToUuid("Herobrine");
    expect(result.uuid).toBe("fedcba9876543210fedcba9876543210");
    expect(result.username).toBe("Herobrine");
  });

  it("throws PlayerNotFoundError when both Mojang and PlayerDB fail to find the player", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(404, {})).mockResolvedValueOnce(jsonResponse(404, {}));
    await expect(resolveIgnToUuid("NoSuchPlayer12345")).rejects.toBeInstanceOf(PlayerNotFoundError);
  });

  it("normalizes dashed UUIDs to a flat lowercase string", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(200, { id: "ABC12345-6789-ABCD-EF01-23456789ABCD", name: "Someone" }));
    const result = await resolveIgnToUuid("Someone");
    expect(result.uuid).toBe("abc123456789abcdef0123456789abcd");
  });
});
