import type { HypixelPlayerResponse } from "../client/types";

type RawPlayer = NonNullable<HypixelPlayerResponse["player"]>;

export interface ParsedPlayerSummary {
  uuid: string;
  displayName: string;
  discordTag: string | null;
  karma: number;
  firstLogin: Date | null;
  lastLogin: Date | null;
}

export function parsePlayerSummary(player: RawPlayer): ParsedPlayerSummary {
  return {
    uuid: player.uuid,
    displayName: player.displayname ?? player.uuid,
    discordTag: player.socialMedia?.links?.DISCORD ?? null,
    karma: player.karma ?? 0,
    firstLogin: player.firstLogin ? new Date(player.firstLogin) : null,
    lastLogin: player.lastLogin ? new Date(player.lastLogin) : null,
  };
}

/**
 * Compares a Hypixel-registered Discord tag against a Discord.js user's identity.
 * Supports both the legacy `username#1234` format and the current unique-username format.
 */
export function discordTagMatchesUser(hypixelDiscordTag: string, discordUser: { username: string; discriminator?: string | null; globalName?: string | null }): boolean {
  const normalized = hypixelDiscordTag.trim().toLowerCase();
  const candidates = [discordUser.username.toLowerCase()];
  if (discordUser.discriminator && discordUser.discriminator !== "0") {
    candidates.push(`${discordUser.username.toLowerCase()}#${discordUser.discriminator}`);
  }
  if (discordUser.globalName) {
    candidates.push(discordUser.globalName.toLowerCase());
  }
  return candidates.includes(normalized);
}
