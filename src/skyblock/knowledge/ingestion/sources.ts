import type { KnowledgeSource } from "../../../database/schema";

export interface KnowledgeSourceConfig {
  source: KnowledgeSource;
  url: string;
  category: string;
}

/**
 * Seed list of Hypixel SkyBlock Wiki pages to ingest by default. Add/remove entries here to
 * control what `npm run knowledge:sync` indexes.
 *
 * IMPORTANT: Hypixel permanently shut down the official wiki (wiki.hypixel.net) in July 2026 -
 * it now just redirects to a forum announcement. The community-maintained successor at
 * https://hypixelskyblock.minecraft.wiki (migrated from Fandom in April 2026, runs on the same
 * Weird Gloop infrastructure as the official Minecraft Wiki/RuneScape Wiki) is what's used here.
 * It's unofficial (Hypixel explicitly doesn't endorse any specific community wiki) but is the
 * de facto actively-maintained source as of this writing. Confirmed reachable and MediaWiki-
 * rendered (same `.mw-parser-output`/`#firstHeading` structure htmlCleaner.ts expects) - verify
 * again if you add pages, since community wiki URLs/hosts can change over time.
 *
 * The official Hypixel API docs at https://api.hypixel.net are a client-rendered Redoc/OpenAPI
 * page (not static HTML), so they aren't auto-scraped here.
 */
export const KNOWLEDGE_SOURCES: KnowledgeSourceConfig[] = [
  { source: "hypixel_wiki", url: "https://hypixelskyblock.minecraft.wiki/w/Skills", category: "skills" },
  { source: "hypixel_wiki", url: "https://hypixelskyblock.minecraft.wiki/w/Combat", category: "combat" },
  { source: "hypixel_wiki", url: "https://hypixelskyblock.minecraft.wiki/w/Catacombs", category: "dungeons" },
  { source: "hypixel_wiki", url: "https://hypixelskyblock.minecraft.wiki/w/Dungeoneering", category: "dungeons" },
  { source: "hypixel_wiki", url: "https://hypixelskyblock.minecraft.wiki/w/Slayer", category: "slayers" },
  { source: "hypixel_wiki", url: "https://hypixelskyblock.minecraft.wiki/w/Magical_Power", category: "accessories" },
  { source: "hypixel_wiki", url: "https://hypixelskyblock.minecraft.wiki/w/Pet_Care", category: "pets" },
  { source: "hypixel_wiki", url: "https://hypixelskyblock.minecraft.wiki/w/Equipment", category: "equipment" },
  { source: "hypixel_wiki", url: "https://hypixelskyblock.minecraft.wiki/w/Armor", category: "equipment" },
  { source: "hypixel_wiki", url: "https://hypixelskyblock.minecraft.wiki/w/Swords", category: "weapons" },
  { source: "hypixel_wiki", url: "https://hypixelskyblock.minecraft.wiki/w/Crit_Damage", category: "stats" },
  { source: "hypixel_wiki", url: "https://hypixelskyblock.minecraft.wiki/w/Reforging", category: "items" },
  { source: "hypixel_wiki", url: "https://hypixelskyblock.minecraft.wiki/w/Auction_House", category: "economy" },
  { source: "hypixel_wiki", url: "https://hypixelskyblock.minecraft.wiki/w/Bazaar_(NPC)", category: "economy" },
];

export const ALLOWED_INGESTION_HOSTS = ["hypixelskyblock.minecraft.wiki", "api.hypixel.net", "raw.githubusercontent.com", "github.com"] as const;
