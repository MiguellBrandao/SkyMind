import { logger } from "../../utils/logger";
import { cleanMediaWikiHtml } from "./mediaWikiCleaner";
import { safeFetch } from "./safeFetch";

export interface WikiSource {
  id: "hypixel_wiki" | "fandom_wiki";
  label: string;
  baseUrl: string;
  articlePath: string;
}

/**
 * Both are MediaWiki installations with a public, unauthenticated search API - confirmed working
 * directly against each host. `hypixelskyblock.minecraft.wiki` is the actively-maintained community
 * successor to Hypixel's now-shut-down official wiki; the Fandom mirror is older/less maintained
 * but occasionally has more detail on niche mechanics, so both are searched.
 */
export const WIKI_SOURCES: WikiSource[] = [
  { id: "hypixel_wiki", label: "SkyBlock Wiki", baseUrl: "https://hypixelskyblock.minecraft.wiki", articlePath: "/w/" },
  { id: "fandom_wiki", label: "Hypixel SkyBlock Wiki (Fandom)", baseUrl: "https://hypixel-skyblock.fandom.com", articlePath: "/wiki/" },
];

export interface WikiSearchHit {
  title: string;
  url: string;
  snippet: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}

/** Queries a MediaWiki site's built-in search API (action=query&list=search) - no auth required. */
export async function searchMediaWiki(source: WikiSource, query: string, limit = 3): Promise<WikiSearchHit[]> {
  const url = new URL("/api.php", source.baseUrl);
  url.searchParams.set("action", "query");
  url.searchParams.set("list", "search");
  url.searchParams.set("srsearch", query);
  url.searchParams.set("srlimit", String(limit));
  url.searchParams.set("format", "json");

  const raw = await safeFetch(url.toString(), "application/json");
  const data = JSON.parse(raw) as { query?: { search?: { title: string; snippet?: string }[] } };
  const hits = data.query?.search ?? [];

  return hits.map((hit) => ({
    title: hit.title,
    url: `${source.baseUrl}${source.articlePath}${encodeURIComponent(hit.title.replace(/ /g, "_"))}`,
    snippet: stripHtml(hit.snippet ?? ""),
  }));
}

/** Fetches and cleans a full wiki article for more detail than a search snippet provides. */
export async function fetchWikiArticle(url: string): Promise<{ title: string; content: string } | null> {
  try {
    const html = await safeFetch(url, "text/html");
    return cleanMediaWikiHtml(html);
  } catch (err) {
    logger.warn({ err, url }, "Failed to fetch full wiki article - falling back to the search snippet");
    return null;
  }
}
