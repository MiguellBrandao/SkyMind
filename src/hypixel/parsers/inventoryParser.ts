import { getPath } from "../../utils/objectPath";
import { decodeItemBytesSafe, type SkyblockItem } from "./nbt";

interface RawItemContainer {
  data?: string;
}

function getContainerData(member: unknown, path: string): string | undefined {
  return getPath<RawItemContainer | undefined>(member, path, undefined)?.data;
}

export async function parseInventoryContents(member: unknown): Promise<SkyblockItem[]> {
  return decodeItemBytesSafe(getContainerData(member, "inventory.inv_contents"));
}

export async function parseArmorContents(member: unknown): Promise<SkyblockItem[]> {
  return decodeItemBytesSafe(getContainerData(member, "inventory.inv_armor"));
}

export async function parseEquipmentContents(member: unknown): Promise<SkyblockItem[]> {
  return decodeItemBytesSafe(getContainerData(member, "inventory.equipment_contents"));
}

export async function parseEnderChestContents(member: unknown): Promise<SkyblockItem[]> {
  return decodeItemBytesSafe(getContainerData(member, "inventory.ender_chest_contents"));
}

export async function parsePersonalVaultContents(member: unknown): Promise<SkyblockItem[]> {
  return decodeItemBytesSafe(getContainerData(member, "inventory.personal_vault_contents"));
}

export async function parseAccessories(member: unknown): Promise<SkyblockItem[]> {
  const items = await decodeItemBytesSafe(getContainerData(member, "inventory.bag_contents.talisman_bag"));
  return items.filter((item) => item.minecraftId !== null);
}

export function getHighestMagicalPower(member: unknown): number {
  return getPath<number>(member, "accessory_bag_storage.highest_magical_power", 0);
}

export function isInventoryApiEnabled(member: unknown): boolean {
  return getContainerData(member, "inventory.inv_contents") !== undefined;
}
