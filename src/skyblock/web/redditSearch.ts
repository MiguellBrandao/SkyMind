import { env } from "../../config/env";
import { logger } from "../../utils/logger";

const TOKEN_URL = "https://www.reddit.com/api/v1/access_token";
const SEARCH_URL = "https://oauth.reddit.com/r/HypixelSkyblock/search";
const USER_AGENT = "web:skymind-discord-bot:1.0 (SkyBlock knowledge search)";

interface CachedToken {
  token: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;

/**
 * Anonymous/unauthenticated requests to Reddit's public .json endpoints are actively blocked
 * (verified: both www.reddit.com and old.reddit.com return 403/redirect from a server IP). Reddit
 * requires a registered OAuth app even for read-only public data now - a free "script" app at
 * https://www.reddit.com/prefs/apps provides a client ID/secret for the client_credentials grant
 * used here. Without them configured, this source is just skipped (not an error).
 */
export function isRedditConfigured(): boolean {
  return Boolean(env.REDDIT_CLIENT_ID && env.REDDIT_CLIENT_SECRET);
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const basicAuth = Buffer.from(`${env.REDDIT_CLIENT_ID}:${env.REDDIT_CLIENT_SECRET}`).toString("base64");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`Reddit OAuth token request failed: HTTP ${res.status}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return cachedToken.token;
}

export interface RedditSearchResult {
  title: string;
  url: string;
  selftext: string;
  score: number;
}

interface RedditListingChild {
  data: { title: string; permalink: string; selftext?: string; score?: number };
}

export async function searchReddit(query: string, limit = 3): Promise<RedditSearchResult[]> {
  if (!isRedditConfigured()) return [];

  try {
    const token = await getAccessToken();
    const url = new URL(SEARCH_URL);
    url.searchParams.set("q", query);
    url.searchParams.set("restrict_sr", "1");
    url.searchParams.set("sort", "relevance");
    url.searchParams.set("limit", String(limit));

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, "User-Agent": USER_AGENT } });
    if (!res.ok) {
      logger.warn({ status: res.status }, "Reddit search request failed");
      return [];
    }

    const data = (await res.json()) as { data?: { children?: RedditListingChild[] } };
    const children = data.data?.children ?? [];

    return children.map((child) => ({
      title: child.data.title,
      url: `https://www.reddit.com${child.data.permalink}`,
      selftext: child.data.selftext ?? "",
      score: child.data.score ?? 0,
    }));
  } catch (err) {
    logger.warn({ err }, "Reddit search failed");
    return [];
  }
}
