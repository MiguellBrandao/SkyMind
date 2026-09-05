import { hypixelConfig } from "../../config";
import { HypixelApiError, HypixelRateLimitError } from "../../utils/errors";
import { logger } from "../../utils/logger";
import { HypixelRateLimiter } from "../rate-limit/RateLimiter";

const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 3;
const MAX_RESPONSE_BYTES = 10 * 1024 * 1024; // 10 MB safety cap

export const rateLimiter = new HypixelRateLimiter(hypixelConfig.maxConcurrency, hypixelConfig.rateLimitPerMinute);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readBodyWithLimit(res: Response): Promise<string> {
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
      throw new HypixelApiError("Hypixel response exceeded maximum allowed size");
    }
    text += decoder.decode(value, { stream: true });
  }
  return text;
}

export async function hypixelRequest<T = unknown>(path: string, searchParams: Record<string, string> = {}): Promise<T> {
  const url = new URL(path, hypixelConfig.baseUrl + "/");
  for (const [key, value] of Object.entries(searchParams)) {
    url.searchParams.set(key, value);
  }

  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    await rateLimiter.acquire();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        headers: { "API-Key": hypixelConfig.apiKey, Accept: "application/json" },
        signal: controller.signal,
      });

      if (res.status === 429) {
        const retryAfterHeader = res.headers.get("retry-after") ?? res.headers.get("Retry-After");
        const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : 5000;
        rateLimiter.triggerCooldown(retryAfterMs);
        lastError = new HypixelRateLimitError(retryAfterMs);
        if (attempt < MAX_RETRIES) continue;
        throw lastError;
      }

      if (res.status >= 500) {
        lastError = new HypixelApiError(`Hypixel API returned ${res.status}`, res.status);
        if (attempt < MAX_RETRIES) {
          await sleep(2 ** attempt * 250);
          continue;
        }
        throw lastError;
      }

      const bodyText = await readBodyWithLimit(res);

      if (res.status === 403) {
        throw new HypixelApiError("Hypixel API key rejected (403)", 403, {
          userMessage: "SkyMind's Hypixel API key is invalid or missing. Please contact the bot administrator.",
        });
      }

      if (!res.ok) {
        throw new HypixelApiError(`Hypixel API returned ${res.status}: ${bodyText.slice(0, 300)}`, res.status);
      }

      return JSON.parse(bodyText) as T;
    } catch (err) {
      if (err instanceof HypixelApiError) throw err;
      lastError = err;
      const isAbort = err instanceof Error && err.name === "AbortError";
      if (attempt < MAX_RETRIES) {
        logger.warn({ err, attempt, path }, isAbort ? "Hypixel request timed out, retrying" : "Hypixel request failed, retrying");
        await sleep(2 ** attempt * 250);
        continue;
      }
      throw new HypixelApiError(isAbort ? "Hypixel request timed out" : "Hypixel request failed", undefined, { cause: err });
    } finally {
      clearTimeout(timeout);
      rateLimiter.release();
    }
  }

  throw lastError instanceof Error ? lastError : new HypixelApiError("Hypixel request failed after retries");
}
