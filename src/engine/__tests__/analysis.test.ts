import { describe, it, expect } from "vitest";
import {
  calculateMedian,
  computeMarketStats,
  findArbitrageOpportunities,
  scoreOpportunity,
} from "../analysis.js";
import type { Listing, ArbitrageOpportunity } from "../../types.js";

function makeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: "test-1",
    marketplace: "blocket",
    title: "Test Item",
    price: 1000,
    currency: "SEK",
    url: "https://example.com/test",
    ...overrides,
  };
}

describe("Analysis Engine", () => {
  describe("calculateMedian", () => {
    it("should return the median of an odd-length array", () => {
      expect(calculateMedian([1, 3, 5, 7, 9])).toBe(5);
    });

    it("should return the median of an even-length array", () => {
      expect(calculateMedian([1, 3, 5, 7])).toBe(4);
    });

    it("should handle a single-element array", () => {
      expect(calculateMedian([42])).toBe(42);
    });

    it("should handle unsorted input", () => {
      expect(calculateMedian([9, 1, 5, 3, 7])).toBe(5);
    });

    it("should return 0 for empty array", () => {
      expect(calculateMedian([])).toBe(0);
    });
  });

  describe("computeMarketStats", () => {
    it("should compute avg, median, min, max from listings", () => {
      const listings: Listing[] = [
        makeListing({ price: 100 }),
        makeListing({ price: 200 }),
        makeListing({ price: 300 }),
        makeListing({ price: 400 }),
        makeListing({ price: 500 }),
      ];

      const stats = computeMarketStats(listings, "test query", "blocket");
      expect(stats.avgPrice).toBe(300);
      expect(stats.medianPrice).toBe(300);
      expect(stats.minPrice).toBe(100);
      expect(stats.maxPrice).toBe(500);
      expect(stats.sampleSize).toBe(5);
      expect(stats.marketplace).toBe("blocket");
      expect(stats.query).toBe("test query");
    });

    it("should handle empty listings", () => {
      const stats = computeMarketStats([], "empty", "blocket");
      expect(stats.avgPrice).toBe(0);
      expect(stats.sampleSize).toBe(0);
    });
  });

  describe("findArbitrageOpportunities", () => {
    it("should identify underpriced listings", () => {
      const buyListings: Listing[] = [
        makeListing({ id: "cheap-1", price: 500, marketplace: "blocket" }),
      ];
      const marketPrices = new Map([
        ["tradera", { avgPrice: 1200, medianPrice: 1100 }],
      ]);
      const fees = { tradera: 0.1, blocket: 0, ebay: 0.13 };

      const opps = findArbitrageOpportunities(buyListings, marketPrices, fees);
      expect(opps.length).toBeGreaterThan(0);
      expect(opps[0].buyPrice).toBe(500);
      expect(opps[0].estimatedProfit).toBeGreaterThan(0);
      expect(opps[0].marginPercent).toBeGreaterThan(0);
    });

    it("should not flag listings at market price", () => {
      const buyListings: Listing[] = [
        makeListing({ id: "fair-1", price: 1000, marketplace: "blocket" }),
      ];
      const marketPrices = new Map([
        ["tradera", { avgPrice: 1000, medianPrice: 1000 }],
      ]);
      const fees = { tradera: 0.1, blocket: 0, ebay: 0.13 };

      const opps = findArbitrageOpportunities(buyListings, marketPrices, fees);
      // Should not find profitable opportunities when buy price = sell price minus fees
      const profitable = opps.filter((o) => o.estimatedProfit > 0);
      expect(profitable.length).toBe(0);
    });

    it("should calculate fees correctly", () => {
      const buyListings: Listing[] = [
        makeListing({ id: "test-fee", price: 500, marketplace: "blocket" }),
      ];
      const marketPrices = new Map([
        ["tradera", { avgPrice: 1000, medianPrice: 1000 }],
      ]);
      const fees = { tradera: 0.1, blocket: 0, ebay: 0.13 };

      const opps = findArbitrageOpportunities(buyListings, marketPrices, fees);
      const traderaOpp = opps.find((o) => o.sellMarketplace === "tradera");
      expect(traderaOpp).toBeDefined();
      // Sell at 1000, fee 10% = 100, profit = 1000 - 100 - 500 = 400
      expect(traderaOpp!.fees).toBeCloseTo(100, 0);
      expect(traderaOpp!.estimatedProfit).toBeCloseTo(400, 0);
    });

    it("should skip when sell marketplace is same as buy marketplace", () => {
      const buyListings: Listing[] = [
        makeListing({ id: "same-1", price: 500, marketplace: "tradera" }),
      ];
      const marketPrices = new Map([
        ["tradera", { avgPrice: 1200, medianPrice: 1100 }],
      ]);
      const fees = { tradera: 0.1, blocket: 0, ebay: 0.13 };

      const opps = findArbitrageOpportunities(buyListings, marketPrices, fees);
      const sameMarketplace = opps.filter(
        (o) => o.sellMarketplace === "tradera"
      );
      expect(sameMarketplace.length).toBe(0);
    });
  });

  describe("scoreOpportunity", () => {
    it("should score high-margin, high-confidence deals higher", () => {
      const highScore = scoreOpportunity(50, 0.9, 5);
      const lowScore = scoreOpportunity(10, 0.3, 30);
      expect(highScore).toBeGreaterThan(lowScore);
    });

    it("should return a score between 0 and 100", () => {
      const score = scoreOpportunity(25, 0.7, 10);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("should penalize long sell times", () => {
      const fast = scoreOpportunity(30, 0.7, 3);
      const slow = scoreOpportunity(30, 0.7, 30);
      expect(fast).toBeGreaterThan(slow);
    });
  });
});
