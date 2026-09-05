import { hypixelClient } from "../hypixel/client/HypixelClient";
import { resolveIgnToUuid } from "../hypixel/client/mojangClient";
import { discordTagMatchesUser, parsePlayerSummary } from "../hypixel/parsers/playerParser";
import { linkedAccountRepository } from "../database/repositories/linkedAccountRepository";
import { verificationRepository, VERIFICATION_TTL_MS } from "../database/repositories/verificationRepository";
import { SYSTEM_SETTING_KEYS, systemSettingsRepository } from "../database/repositories/systemSettingsRepository";
import { generateVerificationCode } from "../utils/crypto";
import { VerificationError } from "../utils/errors";
import { logger } from "../utils/logger";
import type { LinkedAccount } from "../database/schema";

export interface DiscordIdentity {
  username: string;
  discriminator?: string | null;
  globalName?: string | null;
}

export type LinkAttemptResult =
  | { status: "linked"; account: LinkedAccount; profileNameNotFound?: string }
  | { status: "needs_code"; code: string; minecraftUsername: string; expiresInMinutes: number; profileNameNotFound?: string };

async function assertUuidNotAlreadyLinkedElsewhere(minecraftUuid: string, discordUserId: string): Promise<void> {
  const allowMultiLink = await systemSettingsRepository.get<boolean>(SYSTEM_SETTING_KEYS.allowMultiLink, false);
  if (allowMultiLink) return;

  const otherLinks = await linkedAccountRepository.findOtherLinksForUuid(minecraftUuid, discordUserId);
  if (otherLinks.length > 0) {
    throw new VerificationError(
      `Minecraft UUID ${minecraftUuid} is already linked to a different Discord account`,
      "This Minecraft account is already linked to a different Discord account. Ask a server admin if you believe this is a mistake.",
    );
  }
}

/** Resolves a profile "cute name" (e.g. "Kiwi") to its stable profile_id, case-insensitively. Returns null if not found. */
async function resolveProfileIdByName(uuid: string, profileName: string): Promise<string | null> {
  try {
    const profiles = await hypixelClient.getProfiles(uuid);
    return profiles.find((p) => p.cute_name?.toLowerCase() === profileName.toLowerCase())?.profile_id ?? null;
  } catch (err) {
    logger.warn({ err, uuid, profileName }, "Failed to resolve default profile name during link");
    return null;
  }
}

export const linkService = {
  /**
   * Primary flow: resolve IGN -> UUID, then check whether the player already has SkyMind's Discord
   * identity set in their Hypixel "Social Media" settings (socialMedia.links.DISCORD). If it matches
   * the calling Discord user exactly, the link is verified instantly.
   *
   * Otherwise, falls back to a secure one-time-code challenge: the user is asked to temporarily set
   * that same Hypixel Discord field to a bot-generated code, proving control over the Hypixel account's
   * settings without ever touching a password or API key.
   */
  async startLink(discordUserId: string, ign: string, discordIdentity: DiscordIdentity, desiredProfileName?: string): Promise<LinkAttemptResult> {
    const { uuid, username } = await resolveIgnToUuid(ign);
    await assertUuidNotAlreadyLinkedElsewhere(uuid, discordUserId);

    const desiredProfileId = desiredProfileName ? await resolveProfileIdByName(uuid, desiredProfileName) : null;
    const profileNameNotFound = desiredProfileName && !desiredProfileId ? desiredProfileName : undefined;

    const rawPlayer = await hypixelClient.getPlayer(uuid);
    const player = parsePlayerSummary(rawPlayer);

    if (player.discordTag && discordTagMatchesUser(player.discordTag, discordIdentity)) {
      const account = await linkedAccountRepository.upsert({
        discordUserId,
        minecraftUuid: uuid,
        minecraftUsername: username,
        verificationMethod: "social_field",
      });
      if (desiredProfileId) await linkedAccountRepository.setDefaultProfile(discordUserId, desiredProfileId);
      logger.info({ discordUserId, uuid }, "Account linked via social field match");
      return { status: "linked", account, profileNameNotFound };
    }

    const code = `SM-${generateVerificationCode()}`;
    await verificationRepository.create({ discordUserId, minecraftUuid: uuid, minecraftUsername: username, code, desiredDefaultProfileId: desiredProfileId });
    return { status: "needs_code", code, minecraftUsername: username, expiresInMinutes: VERIFICATION_TTL_MS / 60_000, profileNameNotFound };
  },

  /** Confirms a pending code-challenge link by re-checking the Hypixel Discord social field for the code. */
  async confirmCodeChallenge(discordUserId: string): Promise<LinkedAccount> {
    const pending = await verificationRepository.findActiveForUser(discordUserId);
    if (!pending) {
      throw new VerificationError("No active verification code for user", "You don't have an active verification code. Run `/link` again to get a new one.");
    }

    await assertUuidNotAlreadyLinkedElsewhere(pending.minecraftUuid, discordUserId);

    const rawPlayer = await hypixelClient.getPlayer(pending.minecraftUuid);
    const player = parsePlayerSummary(rawPlayer);

    if (!player.discordTag || player.discordTag.trim().toUpperCase() !== pending.code.toUpperCase()) {
      throw new VerificationError(
        "Verification code not found in Hypixel Discord field",
        `Couldn't find the code **${pending.code}** in your Hypixel Discord settings yet. Set it at SkyBlock Menu -> Settings -> Socials & API -> Discord, then try confirming again.`,
      );
    }

    await verificationRepository.markConsumed(pending.id);
    const account = await linkedAccountRepository.upsert({
      discordUserId,
      minecraftUuid: pending.minecraftUuid,
      minecraftUsername: pending.minecraftUsername,
      verificationMethod: "code_challenge",
    });
    if (pending.desiredDefaultProfileId) await linkedAccountRepository.setDefaultProfile(discordUserId, pending.desiredDefaultProfileId);
    logger.info({ discordUserId, uuid: pending.minecraftUuid }, "Account linked via code challenge");
    return account;
  },

  async getLinkedAccount(discordUserId: string): Promise<LinkedAccount | undefined> {
    return linkedAccountRepository.findByDiscordId(discordUserId);
  },

  /** Changes the linked account's default SkyBlock profile (used by /profile, /stats, /ask when no ign/profile is specified). */
  async setDefaultProfile(discordUserId: string, profileName: string): Promise<{ success: boolean; account?: LinkedAccount }> {
    const account = await linkedAccountRepository.findByDiscordId(discordUserId);
    if (!account) throw new VerificationError("No linked account", "You haven't linked a Minecraft account yet. Use `/link` first.");

    const profileId = await resolveProfileIdByName(account.minecraftUuid, profileName);
    if (!profileId) return { success: false };

    await linkedAccountRepository.setDefaultProfile(discordUserId, profileId);
    return { success: true, account };
  },

  async unlink(discordUserId: string): Promise<boolean> {
    return linkedAccountRepository.deleteByDiscordId(discordUserId);
  },

  async adminOverrideLink(discordUserId: string, uuid: string, username: string): Promise<LinkedAccount> {
    return linkedAccountRepository.upsert({ discordUserId, minecraftUuid: uuid, minecraftUsername: username, verificationMethod: "admin_override" });
  },
};
