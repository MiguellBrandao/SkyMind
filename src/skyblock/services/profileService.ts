import { hypixelClient } from "../../hypixel/client/HypixelClient";
import type { SkyblockProfileEntry } from "../../hypixel/client/types";
import {
  getHighestMagicalPower,
  isInventoryApiEnabled,
  parseAccessories,
  parseArmorContents,
  parseDungeons,
  parseEnderChestContents,
  parseEquipmentContents,
  parseInventoryContents,
  parsePets,
  parseRawCollections,
  parseSkills,
  parseSlayers,
  type ParsedDungeons,
  type ParsedPet,
  type ParsedSkills,
  type ParsedSlayer,
} from "../../hypixel/parsers";
import type { SkyblockItem } from "../../hypixel/parsers/nbt";
import { NoSkyBlockProfileError } from "../../utils/errors";
import { getPath } from "../../utils/objectPath";

export interface SkyblockProfileSnapshot {
  profileId: string;
  cuteName: string | null;
  gameMode: string | null;
  uuid: string;
  skyblockLevel: number;
  purseCoins: number;
  bankCoins: number;
  skills: ParsedSkills;
  dungeons: ParsedDungeons;
  pets: ParsedPet[];
  activePet: ParsedPet | null;
  slayers: ParsedSlayer[];
  rawCollections: Record<string, number>;
  magicalPower: number;
  inventoryApiEnabled: boolean;
  fetchedAt: Date;
}

export interface SkyblockProfileDetail extends SkyblockProfileSnapshot {
  inventory: SkyblockItem[];
  armor: SkyblockItem[];
  equipment: SkyblockItem[];
  enderChest: SkyblockItem[];
  accessories: SkyblockItem[];
  /** Raw Hypixel member object (profile.members[uuid]), needed by networthService's NBT-based calculator. */
  rawMember: unknown;
}

function getMember(profile: SkyblockProfileEntry, uuid: string): unknown {
  const member = profile.members[uuid];
  if (!member) throw new NoSkyBlockProfileError(uuid);
  return member;
}

function snapshotFromProfile(profile: SkyblockProfileEntry, uuid: string): SkyblockProfileSnapshot {
  const member = getMember(profile, uuid);

  const skyblockExperience = getPath<number>(member, "leveling.experience", 0);
  const purseCoins = getPath<number>(member, "currencies.coin_purse", 0);
  const bankCoins = profile.banking?.balance ?? 0;
  const pets = parsePets(member);

  return {
    profileId: profile.profile_id,
    cuteName: profile.cute_name ?? null,
    gameMode: profile.game_mode ?? null,
    uuid,
    skyblockLevel: Math.floor(skyblockExperience / 100),
    purseCoins,
    bankCoins,
    skills: parseSkills(member),
    dungeons: parseDungeons(member),
    pets,
    activePet: pets.find((p) => p.active) ?? null,
    slayers: parseSlayers(member),
    rawCollections: parseRawCollections(member),
    magicalPower: getHighestMagicalPower(member),
    inventoryApiEnabled: isInventoryApiEnabled(member),
    fetchedAt: new Date(),
  };
}

export const profileService = {
  async getProfileList(uuid: string) {
    return hypixelClient.getProfiles(uuid);
  },

  async resolveProfile(uuid: string, profileId?: string): Promise<SkyblockProfileEntry> {
    return profileId ? hypixelClient.getProfile(profileId) : hypixelClient.getSelectedProfile(uuid);
  },

  async getSnapshot(uuid: string, profileId?: string): Promise<SkyblockProfileSnapshot> {
    const profile = await this.resolveProfile(uuid, profileId);
    return snapshotFromProfile(profile, uuid);
  },

  snapshotFromProfile,

  async getDetail(uuid: string, profileId?: string): Promise<SkyblockProfileDetail> {
    const profile = await this.resolveProfile(uuid, profileId);
    const member = getMember(profile, uuid);
    const snapshot = snapshotFromProfile(profile, uuid);

    const [inventory, armor, equipment, enderChest, accessories] = await Promise.all([
      parseInventoryContents(member),
      parseArmorContents(member),
      parseEquipmentContents(member),
      parseEnderChestContents(member),
      parseAccessories(member),
    ]);

    return { ...snapshot, inventory, armor, equipment, enderChest, accessories, rawMember: member };
  },
};
