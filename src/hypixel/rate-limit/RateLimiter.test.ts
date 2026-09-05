import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HypixelRateLimiter } from "./RateLimiter";

describe("HypixelRateLimiter", () => {
  let limiter: HypixelRateLimiter;

  afterEach(() => {
    limiter.dispose();
    vi.useRealTimers();
  });

  it("allows up to maxConcurrency requests immediately", async () => {
    limiter = new HypixelRateLimiter(2, 100);
    await limiter.acquire();
    await limiter.acquire();
    expect(limiter.stats.activeCount).toBe(2);
  });

  it("queues requests beyond the concurrency limit until release() is called", async () => {
    limiter = new HypixelRateLimiter(1, 100);
    await limiter.acquire();

    let secondAcquired = false;
    const pending = limiter.acquire().then(() => {
      secondAcquired = true;
    });

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(secondAcquired).toBe(false);

    limiter.release();
    await pending;
    expect(secondAcquired).toBe(true);
  });

  it("blocks new acquisitions during a triggered cooldown", async () => {
    vi.useFakeTimers();
    limiter = new HypixelRateLimiter(5, 100);
    limiter.triggerCooldown(1000);

    let acquired = false;
    const pending = limiter.acquire().then(() => {
      acquired = true;
    });

    await vi.advanceTimersByTimeAsync(500);
    expect(acquired).toBe(false);

    await vi.advanceTimersByTimeAsync(600);
    await pending;
    expect(acquired).toBe(true);
  });

  it("exposes queue length and token stats", async () => {
    limiter = new HypixelRateLimiter(1, 3);
    await limiter.acquire();
    expect(limiter.stats.tokensRemaining).toBe(2);
  });
});
