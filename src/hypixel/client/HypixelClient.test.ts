import { beforeEach, describe, expect, it, vi } from "vitest";
import { NoSkyBlockProfileError, PlayerNotFoundError } from "../../utils/errors";

const mockHypixelRequest = vi.hoisted(() => vi.fn());

vi.mock("./httpClient", () => ({
  hypixelRequest: mockHypixelRequest,
}));
vi.mock("../cache/cachedFetch", () => ({
  getOrSetCache: vi.fn(async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => fetcher()),
}));

import { hypixelClient } from "./HypixelClient";

describe("hypixelClient.getPlayer", () => {
  beforeEach(() => mockHypixelRequest.mockReset());

  it("returns the parsed player object on success", async () => {
    mockHypixelRequest.mockResolvedValue({ success: true, player: { uuid: "abc", displayname: "Steve" } });
    const player = await hypixelClient.getPlayer("abc");
    expect(player.displayname).toBe("Steve");
  });

  it("throws PlayerNotFoundError when Hypixel returns a null player", async () => {
    mockHypixelRequest.mockResolvedValue({ success: true, player: null });
    await expect(hypixelClient.getPlayer("unknown-uuid")).rejects.toBeInstanceOf(PlayerNotFoundError);
  });
});

describe("hypixelClient.getProfiles", () => {
  beforeEach(() => mockHypixelRequest.mockReset());

  it("throws NoSkyBlockProfileError when the player has no profiles", async () => {
    mockHypixelRequest.mockResolvedValue({ success: true, profiles: null });
    await expect(hypixelClient.getProfiles("abc")).rejects.toBeInstanceOf(NoSkyBlockProfileError);
  });

  it("returns the profile list when present", async () => {
    mockHypixelRequest.mockResolvedValue({ success: true, profiles: [{ profile_id: "p1", cute_name: "Kiwi", selected: true, members: {} }] });
    const profiles = await hypixelClient.getProfiles("abc");
    expect(profiles).toHaveLength(1);
    expect(profiles[0]?.cute_name).toBe("Kiwi");
  });
});

describe("hypixelClient.getSelectedProfile", () => {
  beforeEach(() => mockHypixelRequest.mockReset());

  it("picks the profile marked as selected", async () => {
    mockHypixelRequest
      .mockResolvedValueOnce({
        success: true,
        profiles: [
          { profile_id: "p1", cute_name: "Kiwi", selected: false, members: { abc: {} } },
          { profile_id: "p2", cute_name: "Papaya", selected: true, members: { abc: {} } },
        ],
      })
      .mockResolvedValueOnce({ success: true, profile: { profile_id: "p2", cute_name: "Papaya", members: { abc: {} } } });

    const profile = await hypixelClient.getSelectedProfile("abc");
    expect(profile.profile_id).toBe("p2");
  });
});
