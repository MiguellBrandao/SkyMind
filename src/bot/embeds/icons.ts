import { icon } from "./customEmojis";

/**
 * Wraps a {displayKey: [manifestKey, unicodeFallback]} map in a Proxy so property/index access
 * (e.g. `SKILL_ICON.farming` or `SKILL_ICON[key]`) re-resolves `icon()` on every read instead of
 * baking in whatever it returned at module-import time. This matters because the real Minecraft
 * icon mapping is only known after the async startup emoji sync finishes (see emojiSync.ts) -
 * with a plain object these would be frozen as Unicode fallbacks forever.
 */
function lazyIconMap(entries: Record<string, readonly [manifestKey: string, fallback: string]>): Record<string, string> {
  return new Proxy(
    {},
    {
      get(_target, prop: string) {
        const entry = entries[prop];
        return entry ? icon(entry[0], entry[1]) : undefined;
      },
    },
  );
}

export const SKILL_ICON = lazyIconMap({
  farming: ["farming", "🌾"],
  mining: ["mining", "⛏️"],
  combat: ["combat", "⚔️"],
  foraging: ["foraging", "🌳"],
  fishing: ["fishing", "🎣"],
  enchanting: ["enchanting", "📜"],
  alchemy: ["alchemy", "🧪"],
  taming: ["taming", "🐾"],
  carpentry: ["carpentry", "🔨"],
  runecrafting: ["runecrafting", "🔯"],
  social: ["social", "🗨️"],
});

export const DUNGEON_CLASS_ICON = lazyIconMap({
  healer: ["healer", "❤️‍🩹"],
  mage: ["mage", "🔮"],
  berserk: ["berserk", "💢"],
  archer: ["archer", "🏹"],
  tank: ["tank", "🛡️"],
});

export const SLAYER_ICON = lazyIconMap({
  zombie: ["slayer_zombie", "🧟"],
  spider: ["slayer_spider", "🕷️"],
  wolf: ["slayer_wolf", "🐺"],
  enderman: ["slayer_enderman", "🎯"],
  blaze: ["slayer_blaze", "🔥"],
  vampire: ["slayer_vampire", "🧛"],
});

export const SLAYER_ORDER = ["zombie", "spider", "wolf", "enderman", "blaze", "vampire"] as const;

export const STAT_ICON = lazyIconMap({
  skyblockLevel: ["skyblock_level", "🌟"],
  skillAverage: ["skill_average", "📈"],
  catacombs: ["catacombs", "🏰"],
  magicalPower: ["magical_power", "✨"],
  purse: ["purse", "👛"],
  bank: ["bank", "🏦"],
  networth: ["networth", "💎"],
  collections: ["collections", "📦"],
  equipment: ["equipment", "⚔️"],
});
