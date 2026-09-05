import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { KnowledgeBaseError } from "../../utils/errors";
import { assertSafeUrl } from "../../utils/ssrf";

const REQUEST_TIMEOUT_SECONDS = 15;
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024; // 5 MB safety cap per page
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

export const ALLOWED_WEB_HOSTS = ["hypixelskyblock.minecraft.wiki", "hypixel-skyblock.fandom.com"] as const;

function runCurl(args: string[]): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn("curl", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

/**
 * Safely fetches a page for live knowledge lookups: SSRF-guarded (host allowlist + DNS
 * rebinding check), timed out, and size-capped.
 *
 * Shells out to `curl` instead of Node's native `fetch()` because some wiki hosts (Cloudflare-
 * backed) fingerprint Node's TLS/HTTP client and return 403 even with browser-like headers, while
 * curl's TLS handshake passes through fine - verified directly against these hosts. Redirects are
 * never auto-followed (`--max-redirs 0`): the target is unvalidated against the SSRF host
 * allowlist, so a source that starts redirecting elsewhere fails loudly instead of silently
 * fetching whatever it points at.
 */
export async function safeFetch(url: string, accept: "text/html" | "application/json" = "text/html"): Promise<string> {
  const safeUrl = await assertSafeUrl(url, { allowedHosts: ALLOWED_WEB_HOSTS });

  const dir = await mkdtemp(path.join(tmpdir(), "skymind-web-"));
  const bodyFile = path.join(dir, "body");
  const headersFile = path.join(dir, "headers");

  try {
    const { code, stdout, stderr } = await runCurl([
      "--silent",
      "--show-error",
      "--max-time",
      String(REQUEST_TIMEOUT_SECONDS),
      "--max-filesize",
      String(MAX_RESPONSE_BYTES),
      "--max-redirs",
      "0",
      "-A",
      USER_AGENT,
      "-H",
      `Accept: ${accept}`,
      "-D",
      headersFile,
      "-o",
      bodyFile,
      "-w",
      "%{http_code}",
      safeUrl.toString(),
    ]);

    if (code !== 0) {
      throw new KnowledgeBaseError(`Failed to fetch ${url}: curl exited with code ${code} (${stderr.trim() || "no error output"})`);
    }

    const status = Number(stdout.trim());

    if (status >= 300 && status < 400) {
      const headers = await readFile(headersFile, "utf8").catch(() => "");
      const locationMatch = /^location:\s*(.+)$/im.exec(headers);
      throw new KnowledgeBaseError(`${url} redirected to ${locationMatch?.[1]?.trim() ?? "an unknown location"} (HTTP ${status}) - refusing to follow automatically`);
    }

    if (!(status >= 200 && status < 300)) {
      throw new KnowledgeBaseError(`Failed to fetch ${url}: HTTP ${status || "unknown"}`);
    }

    return await readFile(bodyFile, "utf8");
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}
