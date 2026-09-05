import { KnowledgeBaseError } from "../../../utils/errors";
import { logger } from "../../../utils/logger";
import { assertSafeUrl } from "../../../utils/ssrf";
import { ALLOWED_INGESTION_HOSTS } from "./sources";

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024; // 5 MB safety cap per page

/** Safely fetches a page for knowledge ingestion: SSRF-guarded, timed out, and size-capped. */
export async function fetchIngestionPage(url: string): Promise<string> {
  const safeUrl = await assertSafeUrl(url, { allowedHosts: ALLOWED_INGESTION_HOSTS });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(safeUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "SkyMind-KnowledgeSync/1.0 (+https://github.com/)", Accept: "text/html" },
    });

    if (!res.ok) {
      throw new KnowledgeBaseError(`Failed to fetch ${url}: HTTP ${res.status}`);
    }

    const reader = res.body?.getReader();
    if (!reader) return res.text();

    const decoder = new TextDecoder();
    let received = 0;
    let text = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new KnowledgeBaseError(`Response from ${url} exceeded maximum allowed size`);
      }
      text += decoder.decode(value, { stream: true });
    }
    return text;
  } catch (err) {
    if (err instanceof KnowledgeBaseError) throw err;
    logger.error({ err, url }, "Failed to fetch knowledge ingestion page");
    throw new KnowledgeBaseError(`Failed to fetch ${url}`, err);
  } finally {
    clearTimeout(timeout);
  }
}
