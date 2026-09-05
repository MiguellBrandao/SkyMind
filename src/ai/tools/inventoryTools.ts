import { z } from "zod";
import { profileService } from "../../skyblock/services/profileService";
import { serializeItems } from "./itemSerializer";
import { resolveTarget } from "./resolveTarget";
import { defineTool } from "./types";

const ignParam = z.string().min(1).max(16).optional().describe("Minecraft username to look up. Omit to use the calling user's own linked account.");
const profileNameParam = z.string().optional().describe("Optional profile cute name; defaults to the player's currently-selected profile.");

async function resolveProfileId(args: { ign?: string; profileName?: string }, ctx: Parameters<typeof resolveTarget>[1]) {
  const target = await resolveTarget(args, ctx);
  if (!args.profileName) return { uuid: target.uuid, profileId: undefined };
  const profiles = await profileService.getProfileList(target.uuid);
  const match = profiles.find((p) => p.cute_name?.toLowerCase() === args.profileName?.toLowerCase());
  return { uuid: target.uuid, profileId: match?.profile_id };
}

export const getInventoryTool = defineTool({
  name: "get_inventory",
  description: "Fetches the player's main inventory contents (requires the player's Inventory API setting to be enabled). Note: does not include armor, which is a separate slot.",
  category: "inventory",
  schema: z.object({ ign: ignParam, profileName: profileNameParam }),
  handler: async (args, ctx) => {
    const { uuid, profileId } = await resolveProfileId(args, ctx);
    const detail = await profileService.getDetail(uuid, profileId);
    if (!detail.inventoryApiEnabled) {
      return { apiEnabled: false, message: "Inventory API is disabled for this player; the owner must enable it in-game under SkyBlock Menu -> Settings -> Socials & API." };
    }
    return { apiEnabled: true, items: serializeItems(detail.inventory) };
  },
});

export const getEnderChestTool = defineTool({
  name: "get_ender_chest",
  description: "Fetches the player's Ender Chest contents (requires the player's Inventory API setting to be enabled).",
  category: "inventory",
  schema: z.object({ ign: ignParam, profileName: profileNameParam }),
  handler: async (args, ctx) => {
    const { uuid, profileId } = await resolveProfileId(args, ctx);
    const detail = await profileService.getDetail(uuid, profileId);
    if (!detail.inventoryApiEnabled) {
      return { apiEnabled: false, message: "Inventory API is disabled for this player." };
    }
    return { apiEnabled: true, items: serializeItems(detail.enderChest) };
  },
});

export const getAccessoriesTool = defineTool({
  name: "get_accessories",
  description: "Fetches the player's Accessory Bag (talismans/rings/artifacts) contents and their current Magical Power.",
  category: "inventory",
  schema: z.object({ ign: ignParam, profileName: profileNameParam }),
  handler: async (args, ctx) => {
    const { uuid, profileId } = await resolveProfileId(args, ctx);
    const detail = await profileService.getDetail(uuid, profileId);
    if (!detail.inventoryApiEnabled) {
      return { apiEnabled: false, message: "Inventory API is disabled for this player." };
    }
    return { apiEnabled: true, magicalPower: detail.magicalPower, accessories: serializeItems(detail.accessories) };
  },
});

export const getEquipmentTool = defineTool({
  name: "get_equipment",
  description: "Fetches the player's Equipment slots (cloak, belt, gloves, necklace, bracelet) contents.",
  category: "inventory",
  schema: z.object({ ign: ignParam, profileName: profileNameParam }),
  handler: async (args, ctx) => {
    const { uuid, profileId } = await resolveProfileId(args, ctx);
    const detail = await profileService.getDetail(uuid, profileId);
    if (!detail.inventoryApiEnabled) {
      return { apiEnabled: false, message: "Inventory API is disabled for this player." };
    }
    return { apiEnabled: true, equipment: serializeItems(detail.equipment), armor: serializeItems(detail.armor) };
  },
});
