function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Self-throttling token bucket + concurrency limiter for the Hypixel API.
 * Keeps SkyMind under both a max-concurrent-requests cap and a requests-per-minute
 * budget, and can be told to pause entirely when Hypixel returns a 429.
 */
export class HypixelRateLimiter {
  private activeCount = 0;
  private tokens: number;
  private readonly queue: Array<() => void> = [];
  private cooldownUntil = 0;
  private readonly refillTimer: NodeJS.Timeout;

  constructor(
    private readonly maxConcurrency: number,
    private readonly requestsPerMinute: number,
  ) {
    this.tokens = requestsPerMinute;
    this.refillTimer = setInterval(() => {
      this.tokens = this.requestsPerMinute;
      this.drainQueue();
    }, 60_000);
    this.refillTimer.unref?.();
  }

  async acquire(): Promise<void> {
    await this.waitForCooldown();
    await new Promise<void>((resolve) => {
      const tryAcquire = (): void => {
        if (this.activeCount < this.maxConcurrency && this.tokens > 0) {
          this.activeCount++;
          this.tokens--;
          resolve();
        } else {
          this.queue.push(tryAcquire);
        }
      };
      tryAcquire();
    });
    // A cooldown may have been triggered by another in-flight request while we were queued.
    await this.waitForCooldown();
  }

  release(): void {
    this.activeCount = Math.max(0, this.activeCount - 1);
    this.drainQueue();
  }

  /** Called when Hypixel responds 429; pauses all future requests until the cooldown elapses. */
  triggerCooldown(retryAfterMs: number): void {
    this.cooldownUntil = Math.max(this.cooldownUntil, Date.now() + retryAfterMs);
  }

  get stats() {
    return {
      activeCount: this.activeCount,
      tokensRemaining: this.tokens,
      queueLength: this.queue.length,
      cooldownRemainingMs: Math.max(0, this.cooldownUntil - Date.now()),
    };
  }

  private drainQueue(): void {
    while (this.queue.length > 0 && this.activeCount < this.maxConcurrency && this.tokens > 0) {
      const next = this.queue.shift();
      next?.();
    }
  }

  private async waitForCooldown(): Promise<void> {
    const remaining = this.cooldownUntil - Date.now();
    if (remaining > 0) {
      await sleep(remaining);
    }
  }

  dispose(): void {
    clearInterval(this.refillTimer);
  }
}
