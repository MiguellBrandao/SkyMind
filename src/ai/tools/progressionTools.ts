import { z } from "zod";
import { hypixelClient } from "../../hypixel/client/HypixelClient";
import { computeCollectionTiers } from "../../hypixel/parsers/collectionsParser";
import { profileService } from "../../skyblock/services/profileService";
import { resolveTarget } from "./resolveTarget";
import { defineTool } from "./types";

const ignParam = z.string().min(1).max(16).optional().describe("Minecraft username to look up. Omit to use the calling user's own linked account.");

export const getPetsTool = defineTool({
  name: "get_pets",
  description: "Lists all of a player's pets with their rarity, approximate level, and which one is currently active.",
  schema: z.object({ ign: ignParam }),
  handler: async (args, ctx) => {
    const target = await resolveTarget(args, ctx);
    const snapshot = await profileService.getSnapshot(target.uuid, target.profileId);
    return { pets: snapshot.pets, activePet: snapshot.activePet, levelDisclaimer: "Pet levels are approximate estimates; SkyBlock's exact pet XP curve isn't exposed by the Hypixel API." };
  },
});

export const getSkillsTool = defineTool({
  name: "get_skills",
  description: "Fetches all skill levels (Farming, Mining, Combat, Foraging, Fishing, Enchanting, Alchemy, Taming, Carpentry, Runecrafting, Social) and the player's Skill Average.",
  schema: z.object({ ign: ignParam }),
  handler: async (args, ctx) => {
    const target = await resolveTarget(args, ctx);
    const snapshot = await profileService.getSnapshot(target.uuid, target.profileId);
    return snapshot.skills;
  },
});

export const getDungeonsTool = defineTool({
  name: "get_dungeons",
  description: "Fetches Catacombs level, all dungeon class levels (Healer/Mage/Berserk/Archer/Tank), selected class, and secrets found.",
  schema: z.object({ ign: ignParam }),
  handler: async (args, ctx) => {
    const target = await resolveTarget(args, ctx);
    const snapshot = await profileService.getSnapshot(target.uuid, target.profileId);
    return snapshot.dungeons;
  },
});

export const getCollectionsTool = defineTool({
  name: "get_collections",
  description: "Fetches the player's collection progress (amount collected + tier unlocked) for every collection they've made progress in. Requires the player's Collections API setting to be enabled.",
  schema: z.object({ ign: ignParam }),
  handler: async (args, ctx) => {
    const target = await resolveTarget(args, ctx);
    const snapshot = await profileService.getSnapshot(target.uuid, target.profileId);
    if (Object.keys(snapshot.rawCollections).length === 0) {
      return { apiEnabled: false, message: "Collections API is disabled for this player, or they have no collection progress." };
    }
    const resource = await hypixelClient.getResource("collections");
    const tiers = computeCollectionTiers(snapshot.rawCollections, resource);
    return { apiEnabled: true, collections: tiers };
  },
});
