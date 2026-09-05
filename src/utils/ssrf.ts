import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * Blocks requests to loopback, private, link-local, and other non-public IP ranges.
 * Used to protect the knowledge ingestion pipeline (and any other outbound URL fetch)
 * from SSRF when a source list or redirect points somewhere it shouldn't.
 */
function isPrivateOrReservedIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    const octets = ip.split(".").map(Number);
    const [a, b] = octets as [number, number, number, number];
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }
  if (version === 6) {
    const normalized = ip.toLowerCase();
    if (normalized === "::1") return true;
    if (normalized.startsWith("fe80:")) return true; // link-local
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // unique local
    if (normalized.startsWith("::ffff:")) {
      const mapped = normalized.replace("::ffff:", "");
      if (isIP(mapped) === 4) return isPrivateOrReservedIp(mapped);
    }
    return false;
  }
  return true; // not a valid IP literal at all -> treat as unsafe
}

export interface SsrfGuardOptions {
  allowedHosts: readonly string[];
}

export class SsrfBlockedError extends Error {}

/**
 * Validates a URL against an allowlist of hostnames AND resolves DNS to ensure
 * the hostname doesn't point at a private/internal address (DNS rebinding protection).
 * Throws SsrfBlockedError if the URL is not safe to fetch.
 */
export async function assertSafeUrl(rawUrl: string, options: SsrfGuardOptions): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new SsrfBlockedError(`Invalid URL: ${rawUrl}`);
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new SsrfBlockedError(`Blocked non-HTTP(S) protocol: ${url.protocol}`);
  }

  const hostname = url.hostname.toLowerCase();
  const isAllowedHost = options.allowedHosts.some(
    (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`),
  );
  if (!isAllowedHost) {
    throw new SsrfBlockedError(`Host not in allowlist: ${hostname}`);
  }

  if (isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      throw new SsrfBlockedError(`Blocked private/reserved IP literal: ${hostname}`);
    }
    return url;
  }

  const records = await lookup(hostname, { all: true });
  for (const record of records) {
    if (isPrivateOrReservedIp(record.address)) {
      throw new SsrfBlockedError(`Host ${hostname} resolves to a private/reserved address (${record.address})`);
    }
  }

  return url;
}
