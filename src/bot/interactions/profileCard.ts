import type { ActionRowBuilder, ButtonBuilder, EmbedBuilder, StringSelectMenuBuilder } from "discord.js";
import { hypixelClient } from "../../hypixel/client/HypixelClient";
import { getProfileOverviewExtras } from "../../skyblock/services/profileOverviewService";
import { profileService } from "../../skyblock/services/profileService";
import { buildProfileEmbed } from "../embeds/profileEmbed";
import { buildStatsEmbed } from "../embeds/statsEmbed";
import { buildProfileActionRow, buildProfileSelectRow, type ProfileCardView } from "./components";

export type ProfileView = ProfileCardView;

export interface ProfileCardMessage {
  embeds: EmbedBuilder[];
  components: (ActionRowBuilder<ButtonBuilder> | ActionRowBuilder<StringSelectMenuBuilder>)[];
}

/**
 * Builds the full /profile or /stats card (embed + toggle/ask/refresh buttons + profile-switcher
 * dropdown when the account has more than one SkyBlock profile). Shared by the slash commands and
 * every button/select interaction that re-renders the card, so the toggle button and dropdown stay
 * in sync with whichever view (profile overview vs. detailed stats) is currently shown.
 */
export async function buildProfileCard(uuid: string, view: ProfileView, profileId?: string): Promise<ProfileCardMessage> {
  const [player, profiles] = await Promise.all([hypixelClient.getPlayer(uuid), profileService.getProfileList(uuid)]);
  const displayName = player.displayname ?? uuid;

  let embed: EmbedBuilder;
  let resolvedProfileId: string;

  if (view === "stats") {
    const snapshot = await profileService.getSnapshot(uuid, profileId);
    resolvedProfileId = snapshot.profileId;
    embed = buildStatsEmbed(displayName, snapshot, uuid);
  } else {
    const detail = await profileService.getDetail(uuid, profileId);
    resolvedProfileId = detail.profileId;
    const extras = await getProfileOverviewExtras(detail);
    embed = buildProfileEmbed(displayName, detail, { uuid, ...extras });
  }

  const components: (ActionRowBuilder<ButtonBuilder> | ActionRowBuilder<StringSelectMenuBuilder>)[] = [buildProfileActionRow(uuid, view, resolvedProfileId)];
  if (profiles.length > 1) {
    components.push(
      buildProfileSelectRow(
        uuid,
        view,
        profiles.map((p) => ({ profileId: p.profile_id, label: p.cute_name ?? p.profile_id, selected: p.profile_id === resolvedProfileId })),
      ),
    );
  }

  return { embeds: [embed], components };
}
