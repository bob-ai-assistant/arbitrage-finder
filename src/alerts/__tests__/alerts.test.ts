import { describe, it, expect } from "vitest";
import {
  filterOpportunities,
  formatAlertJson,
  createDefaultAlertConfig,
} from "../index.js";
import type { ArbitrageOpportunity, AlertConfig } from "../../types.js";

function makeOpportunity(
  overrides: Partial<ArbitrageOpportunity> = {}
): ArbitrageOpportunity {
  return {
    buyListing: {
      id: "test-1",
      marketplace: "blocket",
      title: "Test Item",
      price: 500,
      currency: "SEK",
      url: "https://example.com/test",
      category: "electronics",
    },
    sellMarketplace: "tradera",
    estimatedSellPrice: 1000,
    buyPrice: 500,
    fees: 100,
    estimatedProfit: 400,
    marginPercent: 80,
    confidence: 0.85,
    estimatedDaysToSell: 7,
    score: 75,
    reason: "Significantly underpriced",
    ...overrides,
  };
}

describe("Alert System", () => {
  describe("createDefaultAlertConfig", () => {
    it("should create config with all categories", () => {
      const config = createDefaultAlertConfig();
      expect(config.categories).toContain("electronics");
      expect(config.categories).toContain("furniture");
      expect(config.categories).toContain("appliances");
      expect(config.categories).toContain("collectibles");
    });

    it("should have default thresholds", () => {
      const config = createDefaultAlertConfig();
      expect(config.minMarginPercent).toBeGreaterThan(0);
      expect(config.minConfidence).toBeGreaterThan(0);
    });
  });

  describe("filterOpportunities", () => {
    it("should filter by minimum margin", () => {
      const opps = [
        makeOpportunity({ marginPercent: 10 }),
        makeOpportunity({ marginPercent: 30 }),
        makeOpportunity({ marginPercent: 50 }),
      ];
      const config: AlertConfig = {
        categories: ["electronics"],
        minMarginPercent: 20,
        minConfidence: 0,
      };

      const filtered = filterOpportunities(opps, config);
      expect(filtered.length).toBe(2);
      expect(filtered.every((o) => o.marginPercent >= 20)).toBe(true);
    });

    it("should filter by minimum confidence", () => {
      const opps = [
        makeOpportunity({ confidence: 0.3 }),
        makeOpportunity({ confidence: 0.7 }),
        makeOpportunity({ confidence: 0.9 }),
      ];
      const config: AlertConfig = {
        categories: ["electronics"],
        minMarginPercent: 0,
        minConfidence: 0.5,
      };

      const filtered = filterOpportunities(opps, config);
      expect(filtered.length).toBe(2);
    });

    it("should filter by max buy price", () => {
      const opps = [
        makeOpportunity({ buyPrice: 500 }),
        makeOpportunity({ buyPrice: 5000 }),
        makeOpportunity({ buyPrice: 15000 }),
      ];
      const config: AlertConfig = {
        categories: ["electronics"],
        minMarginPercent: 0,
        minConfidence: 0,
        maxBuyPrice: 10000,
      };

      const filtered = filterOpportunities(opps, config);
      expect(filtered.length).toBe(2);
    });

    it("should filter by category", () => {
      const opps = [
        makeOpportunity({
          buyListing: {
            ...makeOpportunity().buyListing,
            category: "electronics",
          },
        }),
        makeOpportunity({
          buyListing: {
            ...makeOpportunity().buyListing,
            category: "furniture",
          },
        }),
      ];
      const config: AlertConfig = {
        categories: ["electronics"],
        minMarginPercent: 0,
        minConfidence: 0,
      };

      const filtered = filterOpportunities(opps, config);
      expect(filtered.length).toBe(1);
      expect(filtered[0].buyListing.category).toBe("electronics");
    });

    it("should return empty array when no matches", () => {
      const opps = [makeOpportunity({ marginPercent: 5, confidence: 0.1 })];
      const config: AlertConfig = {
        categories: ["electronics"],
        minMarginPercent: 50,
        minConfidence: 0.8,
      };

      expect(filterOpportunities(opps, config)).toEqual([]);
    });
  });

  describe("formatAlertJson", () => {
    it("should format opportunities as structured JSON", () => {
      const opps = [makeOpportunity()];
      const json = formatAlertJson(opps);
      const parsed = JSON.parse(json);

      expect(parsed.timestamp).toBeDefined();
      expect(parsed.totalOpportunities).toBe(1);
      expect(parsed.opportunities).toHaveLength(1);
      expect(parsed.opportunities[0].buyPrice).toBe(500);
      expect(parsed.opportunities[0].estimatedProfit).toBe(400);
    });

    it("should handle empty opportunities", () => {
      const json = formatAlertJson([]);
      const parsed = JSON.parse(json);
      expect(parsed.totalOpportunities).toBe(0);
      expect(parsed.opportunities).toEqual([]);
    });
  });
});
