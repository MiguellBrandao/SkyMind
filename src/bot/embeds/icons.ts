import { icon } from "./customEmojis";

export const SKILL_ICON: Record<string, string> = {
  farming: icon("farming", "🌾"),
  mining: icon("mining", "⛏️"),
  combat: icon("combat", "⚔️"),
  foraging: icon("foraging", "🌳"),
  fishing: icon("fishing", "🎣"),
  enchanting: icon("enchanting", "📜"),
  alchemy: icon("alchemy", "🧪"),
  taming: icon("taming", "🐾"),
  carpentry: icon("carpentry", "🔨"),
  runecrafting: icon("runecrafting", "🔯"),
  social: icon("social", "🗨️"),
};

export const DUNGEON_CLASS_ICON: Record<string, string> = {
  healer: icon("healer", "❤️‍🩹"),
  mage: icon("mage", "🔮"),
  berserk: icon("berserk", "💢"),
  archer: icon("archer", "🏹"),
  tank: icon("tank", "🛡️"),
};

export const SLAYER_ICON: Record<string, string> = {
  zombie: icon("slayer_zombie", "🧟"),
  spider: icon("slayer_spider", "🕷️"),
  wolf: icon("slayer_wolf", "🐺"),
  enderman: icon("slayer_enderman", "🎯"),
  blaze: icon("slayer_blaze", "🔥"),
  vampire: icon("slayer_vampire", "🧛"),
};

export const SLAYER_ORDER = ["zombie", "spider", "wolf", "enderman", "blaze", "vampire"] as const;

export const STAT_ICON = {
  skyblockLevel: icon("skyblock_level", "🌟"),
  skillAverage: icon("skill_average", "📈"),
  catacombs: icon("catacombs", "🏰"),
  magicalPower: icon("magical_power", "✨"),
  purse: icon("purse", "👛"),
  bank: icon("bank", "🏦"),
  networth: icon("networth", "💎"),
  collections: icon("collections", "📦"),
  equipment: icon("equipment", "⚔️"),
} as const;
