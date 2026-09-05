import { beforeEach, describe, expect, it, vi } from "vitest";
import { VerificationError } from "../utils/errors";

const { mockGetPlayer, mockResolveIgnToUuid, mockFindOtherLinksForUuid, mockUpsertLinkedAccount, mockCreateVerification, mockFindActiveForUser, mockMarkConsumed } = vi.hoisted(() => ({
  mockGetPlayer: vi.fn(),
  mockResolveIgnToUuid: vi.fn(),
  mockFindOtherLinksForUuid: vi.fn(),
  mockUpsertLinkedAccount: vi.fn(),
  mockCreateVerification: vi.fn(),
  mockFindActiveForUser: vi.fn(),
  mockMarkConsumed: vi.fn(),
}));

vi.mock("../hypixel/client/HypixelClient", () => ({
  hypixelClient: { getPlayer: mockGetPlayer },
}));
vi.mock("../hypixel/client/mojangClient", () => ({
  resolveIgnToUuid: mockResolveIgnToUuid,
}));
vi.mock("../database/repositories/linkedAccountRepository", () => ({
  linkedAccountRepository: {
    findOtherLinksForUuid: mockFindOtherLinksForUuid,
    upsert: mockUpsertLinkedAccount,
    deleteByDiscordId: vi.fn(),
  },
}));
vi.mock("../database/repositories/verificationRepository", () => ({
  verificationRepository: {
    create: mockCreateVerification,
    findActiveForUser: mockFindActiveForUser,
    markConsumed: mockMarkConsumed,
  },
  VERIFICATION_TTL_MS: 15 * 60 * 1000,
}));

import { linkService } from "./linkService";

const discordIdentity = { username: "steve", discriminator: "0", globalName: "Steve" };

describe("linkService.startLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindOtherLinksForUuid.mockResolvedValue([]);
    mockResolveIgnToUuid.mockResolvedValue({ uuid: "uuid-1", username: "Steve" });
  });

  it("links immediately when the Hypixel Discord social field matches the caller", async () => {
    mockGetPlayer.mockResolvedValue({ uuid: "uuid-1", socialMedia: { links: { DISCORD: "steve" } } });
    mockUpsertLinkedAccount.mockResolvedValue({ discordUserId: "d1", minecraftUsername: "Steve", minecraftUuid: "uuid-1" });

    const result = await linkService.startLink("d1", "Steve", discordIdentity);

    expect(result.status).toBe("linked");
    expect(mockUpsertLinkedAccount).toHaveBeenCalledWith(expect.objectContaining({ verificationMethod: "social_field" }));
  });

  it("falls back to a code challenge when the social field doesn't match", async () => {
    mockGetPlayer.mockResolvedValue({ uuid: "uuid-1", socialMedia: { links: { DISCORD: "someone_else" } } });
    mockCreateVerification.mockResolvedValue({ id: "v1" });

    const result = await linkService.startLink("d1", "Steve", discordIdentity);

    expect(result.status).toBe("needs_code");
    if (result.status === "needs_code") {
      expect(result.code).toMatch(/^SM-/);
    }
    expect(mockCreateVerification).toHaveBeenCalled();
  });

  it("rejects linking a Minecraft account already linked to a different Discord user", async () => {
    mockFindOtherLinksForUuid.mockResolvedValue([{ discordUserId: "someone-else" }]);
    await expect(linkService.startLink("d1", "Steve", discordIdentity)).rejects.toBeInstanceOf(VerificationError);
  });
});

describe("linkService.confirmCodeChallenge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindOtherLinksForUuid.mockResolvedValue([]);
  });

  it("finalizes the link when the code appears in the Discord social field", async () => {
    mockFindActiveForUser.mockResolvedValue({ id: "v1", minecraftUuid: "uuid-1", minecraftUsername: "Steve", code: "SM-ABCD1234" });
    mockGetPlayer.mockResolvedValue({ uuid: "uuid-1", socialMedia: { links: { DISCORD: "SM-ABCD1234" } } });
    mockUpsertLinkedAccount.mockResolvedValue({ discordUserId: "d1", minecraftUsername: "Steve" });

    await linkService.confirmCodeChallenge("d1");

    expect(mockMarkConsumed).toHaveBeenCalledWith("v1");
    expect(mockUpsertLinkedAccount).toHaveBeenCalledWith(expect.objectContaining({ verificationMethod: "code_challenge" }));
  });

  it("throws when there is no active verification code", async () => {
    mockFindActiveForUser.mockResolvedValue(undefined);
    await expect(linkService.confirmCodeChallenge("d1")).rejects.toBeInstanceOf(VerificationError);
  });

  it("throws when the code hasn't been set in-game yet", async () => {
    mockFindActiveForUser.mockResolvedValue({ id: "v1", minecraftUuid: "uuid-1", minecraftUsername: "Steve", code: "SM-ABCD1234" });
    mockGetPlayer.mockResolvedValue({ uuid: "uuid-1", socialMedia: { links: {} } });
    await expect(linkService.confirmCodeChallenge("d1")).rejects.toBeInstanceOf(VerificationError);
    expect(mockMarkConsumed).not.toHaveBeenCalled();
  });
});
