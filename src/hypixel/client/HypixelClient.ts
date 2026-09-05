import { cacheTtl } from "../../config";
import { NoSkyBlockProfileError, PlayerNotFoundError } from "../../utils/errors";
import { logger } from "../../utils/logger";
import { cacheKeys } from "../cache/cacheKeys";
import { getOrSetCache } from "../cache/cachedFetch";
import { hypixelRequest } from "./httpClient";
import {
  hypixelAuctionsPageSchema,
  hypixelBazaarSchema,
  hypixelItemsResourceSchema,
  hypixelPlayerAuctionsSchema,
  hypixelPlayerSchema,
  hypixelProfileSchema,
  hypixelProfilesSchema,
  hypixelResourceSchema,
  type HypixelAuction,
  type HypixelBazaarResponse,
  type SkyblockItemDefinition,
  type SkyblockProfileEntry,
} from "./types";

const MAX_AUCTION_INDEX_PAGES = 60;

export const hypixelClient = {
  async getPlayer(uuid: string) {
    const data = await getOrSetCache(cacheKeys.player(uuid), cacheTtl.player, async () => {
      const raw = await hypixelRequest("player", { uuid });
      return hypixelPlayerSchema.parse(raw);
    });
    if (!data.success || !data.player) {
      throw new PlayerNotFoundError(uuid);
    }
    return data.player;
  },

  async getProfiles(uuid: string): Promise<SkyblockProfileEntry[]> {
    const data = await getOrSetCache(cacheKeys.profiles(uuid), cacheTtl.profiles, async () => {
      const raw = await hypixelRequest("skyblock/profiles", { uuid });
      return hypixelProfilesSchema.parse(raw);
    });
    if (!data.success || !data.profiles || data.profiles.length === 0) {
      throw new NoSkyBlockProfileError(uuid);
    }
    return data.profiles;
  },

  async getProfile(profileId: string): Promise<SkyblockProfileEntry> {
    const data = await getOrSetCache(cacheKeys.profile(profileId), cacheTtl.profile, async () => {
      const raw = await hypixelRequest("skyblock/profile", { profile: profileId });
      return hypixelProfileSchema.parse(raw);
    });
    if (!data.success || !data.profile) {
      throw new NoSkyBlockProfileError(profileId);
    }
    return data.profile;
  },

  /** Returns the profile the player currently has selected in-game, or the most recently played one as a fallback. */
  async getSelectedProfile(uuid: string): Promise<SkyblockProfileEntry> {
    const profiles = await this.getProfiles(uuid);
    const selected = profiles.find((p) => p.selected);
    if (selected) return this.getProfile(selected.profile_id);

    const mostRecent = [...profiles].sort((a, b) => {
      const aMember = a.members[uuid] as { last_save?: number } | undefined;
      const bMember = b.members[uuid] as { last_save?: number } | undefined;
      return (bMember?.last_save ?? 0) - (aMember?.last_save ?? 0);
    })[0];
    if (!mostRecent) throw new NoSkyBlockProfileError(uuid);
    return this.getProfile(mostRecent.profile_id);
  },

  async getBazaar(): Promise<HypixelBazaarResponse> {
    return getOrSetCache(cacheKeys.bazaar(), cacheTtl.bazaar, async () => {
      const raw = await hypixelRequest("skyblock/bazaar");
      return hypixelBazaarSchema.parse(raw);
    });
  },

  async getAuctionsPage(page: number) {
    return getOrSetCache(cacheKeys.auctionsPage(page), cacheTtl.auctions, async () => {
      const raw = await hypixelRequest("skyblock/auctions", { page: String(page) });
      return hypixelAuctionsPageSchema.parse(raw);
    });
  },

  async getPlayerAuctions(uuid: string) {
    const data = await getOrSetCache(cacheKeys.auctionsByPlayer(uuid), cacheTtl.auctions, async () => {
      const raw = await hypixelRequest("skyblock/auction", { player: uuid });
      return hypixelPlayerAuctionsSchema.parse(raw);
    });
    return data.auctions ?? [];
  },

  async getResource(name: "collections" | "skills") {
    return getOrSetCache(cacheKeys.resource(name), cacheTtl.static, async () => {
      const raw = await hypixelRequest(`resources/skyblock/${name}`);
      return hypixelResourceSchema.parse(raw);
    });
  },

  async getItemsResource(): Promise<SkyblockItemDefinition[]> {
    const data = await getOrSetCache(cacheKeys.itemsResource(), cacheTtl.static, async () => {
      const raw = await hypixelRequest("resources/skyblock/items");
      return hypixelItemsResourceSchema.parse(raw);
    });
    return data.items ?? [];
  },

  /**
   * Builds an in-memory index of active auctions by fetching up to MAX_AUCTION_INDEX_PAGES pages.
   * This is expensive (dozens of upstream requests) so the result is cached as a whole for
   * cacheTtl.auctions seconds and reused across all callers/tools in that window.
   */
  async buildAuctionIndex(): Promise<HypixelAuction[]> {
    return getOrSetCache(cacheKeys.auctionsIndex(), cacheTtl.auctions, async () => {
      const firstPage = await this.getAuctionsPage(0);
      const totalPages = Math.min(firstPage.totalPages ?? 1, MAX_AUCTION_INDEX_PAGES);
      if ((firstPage.totalPages ?? 1) > MAX_AUCTION_INDEX_PAGES) {
        logger.warn({ totalPages: firstPage.totalPages, cappedAt: MAX_AUCTION_INDEX_PAGES }, "Auction index capped to first N pages for cost control");
      }

      const auctions: HypixelAuction[] = [...(firstPage.auctions ?? [])];
      const remainingPages = Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => i + 1);

      // Fetch remaining pages with bounded concurrency (the shared rate limiter caps concurrency globally too).
      const CHUNK_SIZE = 8;
      for (let i = 0; i < remainingPages.length; i += CHUNK_SIZE) {
        const chunk = remainingPages.slice(i, i + CHUNK_SIZE);
        const results = await Promise.all(chunk.map((page) => this.getAuctionsPage(page)));
        for (const result of results) {
          auctions.push(...(result.auctions ?? []));
        }
      }

      return auctions;
    });
  },
};

export type HypixelClient = typeof hypixelClient;
