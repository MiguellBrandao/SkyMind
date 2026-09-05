/**
 * Maps SkyMind's icon keys to real Minecraft item textures (not emoji), sourced from
 * PrismarineJS/minecraft-assets (extracted game textures, same legal basis every Minecraft
 * wiki/tool relies on per Mojang's Brand and Assets Usage Guidelines - fan content only, no
 * resale, no implied endorsement). `npm run emojis:upload` turns these into Discord Application
 * Emoji so embeds can render `<:sm_x:id>` instead of Unicode - see customEmojis.ts.
 */
export const ICON_MANIFEST: Record<string, string> = {
  // Skills
  farming: "wheat",
  mining: "diamond_pickaxe",
  combat: "diamond_sword",
  foraging: "diamond_axe",
  fishing: "fishing_rod",
  enchanting: "enchanted_book",
  alchemy: "brewing_stand",
  taming: "lead",
  carpentry: "stick",
  runecrafting: "prismarine_crystals",
  social: "name_tag",

  // Dungeon classes
  healer: "golden_apple",
  mage: "blaze_powder",
  berserk: "netherite_sword",
  archer: "bow",
  tank: "iron_chestplate",

  // Slayers
  slayer_zombie: "rotten_flesh",
  slayer_spider: "spider_eye",
  slayer_wolf: "bone",
  slayer_enderman: "ender_pearl",
  slayer_blaze: "blaze_rod",
  slayer_vampire: "redstone",

  // Profile/stats headline stats
  skyblock_level: "experience_bottle",
  skill_average: "written_book",
  catacombs: "filled_map",
  magical_power: "nether_star",
  purse: "gold_ingot",
  bank: "emerald",
  networth: "diamond",
  collections: "hopper",
  equipment: "diamond_chestplate",
};

export const MINECRAFT_ASSETS_VERSION = "1.21.1";

export function minecraftItemTextureUrl(itemName: string): string {
  return `https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/${MINECRAFT_ASSETS_VERSION}/items/${itemName}.png`;
}
