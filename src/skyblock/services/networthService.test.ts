import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetNetworth, mockGetMuseum } = vi.hoisted(() => ({ mockGetNetworth: vi.fn(), mockGetMuseum: vi.fn() }));

vi.mock("skyhelper-networth", () => ({
  ProfileNetworthCalculator: class {
    getNetworth = mockGetNetworth;
  },
  UpdateManager: { disable: vi.fn() },
}));

vi.mock("../../hypixel/client/HypixelClient", () => ({
  hypixelClient: { getMuseum: mockGetMuseum },
}));

import { calculateNetWorth } from "./networthService";
import type { SkyblockProfileDetail } from "./profileService";

function fakeProfile(overrides: Partial<SkyblockProfileDetail> = {}): SkyblockProfileDetail {
  return {
    profileId: "profile-1",
    cuteName: "Kiwi",
    gameMode: "classic",
    uuid: "uuid-1",
    skyblockLevel: 100,
    purseCoins: 0,
    bankCoins: 0,
    skills: { skills: {}, skillAverage: 0 },
    dungeons: { catacombs: { level: 0, maxLevel: 50, currentXp: 0, xpIntoLevel: 0, xpForNextLevel: null, progressToNext: 0 }, masterCatacombs: null, classes: {} as never, selectedClass: null, classAverage: 0, secretsFound: 0 },
    pets: [],
    activePet: null,
    slayers: [],
    rawCollections: {},
    magicalPower: 0,
    inventoryApiEnabled: true,
    fetchedAt: new Date(),
    inventory: [],
    armor: [],
    equipment: [],
    enderChest: [],
    accessories: [],
    rawMember: { some: "raw-data" },
    ...overrides,
  };
}

describe("calculateNetWorth", () => {
  beforeEach(() => {
    mockGetNetworth.mockReset();
    mockGetMuseum.mockReset();
  });

  it("fetches museum data and forwards the rounded networth figures", async () => {
    mockGetMuseum.mockResolvedValue({ members: { "uuid-1": { museum: true } } });
    mockGetNetworth.mockResolvedValue({ networth: 90_250_000.6, unsoulboundNetworth: 80_000_000.4, noInventory: false });

    const result = await calculateNetWorth(fakeProfile());

    expect(mockGetMuseum).toHaveBeenCalledWith("profile-1");
    expect(result).toEqual({ networth: 90_250_001, unsoulboundNetworth: 80_000_000, incomplete: false });
  });

  it("flags incomplete when the player's Inventory API is disabled", async () => {
    mockGetMuseum.mockResolvedValue({ members: {} });
    mockGetNetworth.mockResolvedValue({ networth: 1000, unsoulboundNetworth: 1000, noInventory: true });

    const result = await calculateNetWorth(fakeProfile());

    expect(result.incomplete).toBe(true);
  });

  it("still computes networth if the museum fetch fails", async () => {
    mockGetMuseum.mockRejectedValue(new Error("museum unavailable"));
    mockGetNetworth.mockResolvedValue({ networth: 500, unsoulboundNetworth: 500, noInventory: false });

    const result = await calculateNetWorth(fakeProfile());

    expect(result.networth).toBe(500);
  });
});
