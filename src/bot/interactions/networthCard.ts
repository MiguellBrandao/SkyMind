import { ActionRowBuilder, ButtonBuilder, ButtonStyle, type EmbedBuilder, type StringSelectMenuBuilder } from "discord.js";
import { hypixelClient } from "../../hypixel/client/HypixelClient";
import { calculateDetailedNetWorth } from "../../skyblock/services/networthService";
import { profileService } from "../../skyblock/services/profileService";
import { buildNetworthEmbed } from "../embeds/networthEmbed";
import { buildProfileSelectRow } from "./components";

export interface NetworthCardMessage {
  embeds: EmbedBuilder[];
  components: (ActionRowBuilder<ButtonBuilder> | ActionRowBuilder<StringSelectMenuBuilder>)[];
}

function buildNetworthActionRow(uuid: string, profileId: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`networth:refresh:${uuid}:${profileId}`).setLabel("Refresh").setStyle(ButtonStyle.Secondary).setEmoji("🔄"),
  );
}

/** Builds the /networth card: detailed net worth breakdown + Refresh + a profile-switcher dropdown for multi-profile accounts. */
export async function buildNetworthCard(uuid: string, profileId?: string): Promise<NetworthCardMessage> {
  const [player, detail, profiles] = await Promise.all([hypixelClient.getPlayer(uuid), profileService.getDetail(uuid, profileId), profileService.getProfileList(uuid)]);
  const result = await calculateDetailedNetWorth(detail);
  const embed = buildNetworthEmbed(player.displayname ?? uuid, uuid, detail.cuteName, result);

  const components: (ActionRowBuilder<ButtonBuilder> | ActionRowBuilder<StringSelectMenuBuilder>)[] = [buildNetworthActionRow(uuid, detail.profileId)];
  if (profiles.length > 1) {
    components.push(
      buildProfileSelectRow(
        uuid,
        "detail",
        profiles.map((p) => ({ profileId: p.profile_id, label: p.cute_name ?? p.profile_id, selected: p.profile_id === detail.profileId })),
        "networth",
      ),
    );
  }

  return { embeds: [embed], components };
}
