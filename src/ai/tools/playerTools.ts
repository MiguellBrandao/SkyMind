import { z } from "zod";
import { hypixelClient } from "../../hypixel/client/HypixelClient";
import { parsePlayerSummary } from "../../hypixel/parsers/playerParser";
import { NoSkyBlockProfileError } from "../../utils/errors";
import { profileService } from "../../skyblock/services/profileService";
import { resolveTarget } from "./resolveTarget";
import { defineTool } from "./types";

const ignParam = z.string().min(1).max(16).optional().describe("Minecraft username to look up. Omit to use the calling user's own linked account.");

export const getPlayerTool = defineTool({
  name: "get_player",
  description: "Fetches basic Hypixel player info (display name, karma, login history) for a Minecraft account. Does not include SkyBlock data.",
  category: "player",
  schema: z.object({ ign: ignParam }),
  handler: async (args, ctx) => {
    const target = await resolveTarget(args, ctx);
    const player = await hypixelClient.getPlayer(target.uuid);
    return parsePlayerSummary(player);
  },
});

export const getProfilesTool = defineTool({
  name: "get_profiles",
  description: "Lists all SkyBlock profiles (islands) for a player, including which one is currently selected in-game.",
  category: "player",
  schema: z.object({ ign: ignParam }),
  handler: async (args, ctx) => {
    const target = await resolveTarget(args, ctx);
    const profiles = await profileService.getProfileList(target.uuid);
    return profiles.map((p) => ({
      profileId: p.profile_id,
      cuteName: p.cute_name ?? null,
      gameMode: p.game_mode ?? "classic",
      selected: p.selected ?? false,
    }));
  },
});

export const getSelectedProfileTool = defineTool({
  name: "get_selected_profile",
  description: "Fetches a summary (level, skills, dungeons, pets, coins, magical power) of the SkyBlock profile the player currently has selected in-game.",
  category: "player",
  alwaysInclude: true,
  schema: z.object({ ign: ignParam }),
  handler: async (args, ctx) => {
    const target = await resolveTarget(args, ctx);
    return profileService.getSnapshot(target.uuid);
  },
});

export const getSkyblockProfileTool = defineTool({
  name: "get_skyblock_profile",
  description: "Fetches a summary of a specific named SkyBlock profile (e.g. 'Kiwi', 'Papaya') for a player, instead of just their currently-selected one. Use when the user names a specific profile.",
  category: "player",
  schema: z.object({
    ign: ignParam,
    profileName: z.string().min(1).describe("The profile's cute name, e.g. 'Kiwi' or 'Papaya' (case-insensitive)."),
  }),
  handler: async (args, ctx) => {
    const target = await resolveTarget(args, ctx);
    const profiles = await profileService.getProfileList(target.uuid);
    const match = profiles.find((p) => p.cute_name?.toLowerCase() === args.profileName.toLowerCase());
    if (!match) {
      throw new NoSkyBlockProfileError(`${target.username} (profile "${args.profileName}")`);
    }
    return profileService.getSnapshot(target.uuid, match.profile_id);
  },
});
