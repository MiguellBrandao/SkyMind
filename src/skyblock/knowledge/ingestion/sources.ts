import type { KnowledgeSource } from "../../../database/schema";

export interface KnowledgeSourceConfig {
  source: KnowledgeSource;
  url: string;
  category: string;
}

/**
 * Seed list of official Hypixel SkyBlock Wiki pages (wiki.hypixel.net, MediaWiki-rendered,
 * confirmed reachable) to ingest by default. Add/remove entries here to control what
 * `npm run knowledge:sync` indexes - it's safe to add more wiki.hypixel.net pages.
 *
 * The official Hypixel API docs at https://api.hypixel.net are a client-rendered Redoc/OpenAPI
 * page (not static HTML), so they aren't auto-scraped here. If Hypixel publishes a static/JSON
 * mirror of that spec, add a small dedicated parser for it in htmlCleaner.ts and register it
 * below with source: "hypixel_api_docs".
 */
export const KNOWLEDGE_SOURCES: KnowledgeSourceConfig[] = [
  { source: "hypixel_wiki", url: "https://wiki.hypixel.net/Skills", category: "skills" },
  { source: "hypixel_wiki", url: "https://wiki.hypixel.net/Combat", category: "combat" },
  { source: "hypixel_wiki", url: "https://wiki.hypixel.net/Catacombs", category: "dungeons" },
  { source: "hypixel_wiki", url: "https://wiki.hypixel.net/Dungeoneering", category: "dungeons" },
  { source: "hypixel_wiki", url: "https://wiki.hypixel.net/Slayer", category: "slayers" },
  { source: "hypixel_wiki", url: "https://wiki.hypixel.net/Magical_Power", category: "accessories" },
  { source: "hypixel_wiki", url: "https://wiki.hypixel.net/Pet_Care", category: "pets" },
  { source: "hypixel_wiki", url: "https://wiki.hypixel.net/Equipment", category: "equipment" },
  { source: "hypixel_wiki", url: "https://wiki.hypixel.net/Armor", category: "equipment" },
  { source: "hypixel_wiki", url: "https://wiki.hypixel.net/Swords", category: "weapons" },
  { source: "hypixel_wiki", url: "https://wiki.hypixel.net/Crit_Damage", category: "stats" },
  { source: "hypixel_wiki", url: "https://wiki.hypixel.net/Reforging", category: "items" },
  { source: "hypixel_wiki", url: "https://wiki.hypixel.net/Auction_House", category: "economy" },
  { source: "hypixel_wiki", url: "https://wiki.hypixel.net/Bazaar_(NPC)", category: "economy" },
];

export const ALLOWED_INGESTION_HOSTS = ["wiki.hypixel.net", "api.hypixel.net", "raw.githubusercontent.com", "github.com"] as const;
