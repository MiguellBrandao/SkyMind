import { describe, expect, it } from "vitest";
import { assertSafeUrl, SsrfBlockedError } from "./ssrf";

describe("assertSafeUrl", () => {
  it("allows an https URL on the allowlist", async () => {
    const url = await assertSafeUrl("https://wiki.hypixel.net/Catacombs", { allowedHosts: ["wiki.hypixel.net"] });
    expect(url.hostname).toBe("wiki.hypixel.net");
  });

  it("allows subdomains of an allowlisted host", async () => {
    const url = await assertSafeUrl("https://raw.githubusercontent.com/foo/bar", { allowedHosts: ["githubusercontent.com"] });
    expect(url.hostname).toBe("raw.githubusercontent.com");
  });

  it("rejects a host not on the allowlist", async () => {
    await expect(assertSafeUrl("https://evil.example.com/page", { allowedHosts: ["wiki.hypixel.net"] })).rejects.toBeInstanceOf(SsrfBlockedError);
  });

  it("rejects a private IP literal even if 'allowed'", async () => {
    await expect(assertSafeUrl("http://127.0.0.1/admin", { allowedHosts: ["127.0.0.1"] })).rejects.toBeInstanceOf(SsrfBlockedError);
  });

  it("rejects an internal 10.x.x.x IP literal", async () => {
    await expect(assertSafeUrl("http://10.0.0.5/", { allowedHosts: ["10.0.0.5"] })).rejects.toBeInstanceOf(SsrfBlockedError);
  });

  it("rejects a non-HTTP protocol", async () => {
    await expect(assertSafeUrl("file:///etc/passwd", { allowedHosts: ["etc"] })).rejects.toBeInstanceOf(SsrfBlockedError);
  });

  it("rejects a malformed URL", async () => {
    await expect(assertSafeUrl("not a url", { allowedHosts: ["wiki.hypixel.net"] })).rejects.toBeInstanceOf(SsrfBlockedError);
  });
});
