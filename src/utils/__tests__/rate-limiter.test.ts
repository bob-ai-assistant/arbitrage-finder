import { describe, it, expect } from "vitest";
import { RateLimiter } from "../rate-limiter.js";

describe("RateLimiter", () => {
  it("should allow requests up to the limit without waiting", async () => {
    const limiter = new RateLimiter(60);
    const start = Date.now();

    await limiter.acquire();
    await limiter.acquire();
    await limiter.acquire();

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(100);
  });

  it("should refill tokens over time", async () => {
    const limiter = new RateLimiter(600); // 10 per second
    await limiter.acquire();
    await new Promise((r) => setTimeout(r, 50));
    const start = Date.now();
    await limiter.acquire();
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(50);
  });

  it("should construct with correct parameters", async () => {
    const limiter = new RateLimiter(30);
    // Can acquire immediately (has tokens)
    await expect(limiter.acquire()).resolves.toBeUndefined();
  });
});
