import { describe, it, expect, afterAll } from "vitest";
import { FacebookAdapter } from "../adapters/facebook.js";
import {
  computeMarketStats,
  findArbitrageOpportunities,
} from "../engine/analysis.js";
import { filterOpportunities, formatAlertJson } from "../alerts/index.js";
import { getCategoryConfig, getAllCategories } from "../categories/index.js";
import { createAllAdapters, createAdapter } from "../adapters/index.js";
import type { AlertConfig } from "../types.js";

describe("Integration: Full pipeline", () => {
  it("should find opportunities from Facebook mock data end-to-end", async () => {
    // 1. Search using Facebook mock adapter
    const fb = new FacebookAdapter();
    const listings = await fb.search("iPhone", { category: "electronics" });
    expect(listings.length).toBeGreaterThan(0);

    // 2. Compute market stats
    const stats = computeMarketStats(listings, "iPhone", "facebook");
    expect(stats.avgPrice).toBeGreaterThan(0);
    expect(stats.sampleSize).toBeGreaterThan(0);

    // 3. Create price map with a higher price on another marketplace
    const marketPrices = new Map([
      ["tradera", { avgPrice: stats.avgPrice * 1.5, medianPrice: stats.medianPrice * 1.5 }],
    ]);

    // 4. Find arbitrage opportunities
    const fees = { tradera: 0.1, ebay: 0.13, blocket: 0, facebook: 0 };
    const opps = findArbitrageOpportunities(listings, marketPrices, fees);
    expect(opps.length).toBeGreaterThan(0);

    // 5. Filter with alert config
    const alertConfig: AlertConfig = {
      categories: ["electronics"],
      minMarginPercent: 10,
      minConfidence: 0.1,
    };
    const filtered = filterOpportunities(opps, alertConfig);
    expect(filtered.length).toBeGreaterThan(0);

    // 6. Format as JSON
    const json = formatAlertJson(filtered);
    const parsed = JSON.parse(json);
    expect(parsed.totalOpportunities).toBeGreaterThan(0);
    expect(parsed.opportunities[0].estimatedProfit).toBeGreaterThan(0);
  });

  it("should handle the adapter factory correctly", () => {
    const allAdapters = createAllAdapters();
    expect(allAdapters).toHaveLength(4);

    const names = allAdapters.map((a) => a.name);
    expect(names).toContain("blocket");
    expect(names).toContain("tradera");
    expect(names).toContain("ebay");
    expect(names).toContain("facebook");
  });

  it("should create individual adapters by name", () => {
    expect(createAdapter("blocket")?.name).toBe("blocket");
    expect(createAdapter("tradera")?.name).toBe("tradera");
    expect(createAdapter("ebay")?.name).toBe("ebay");
    expect(createAdapter("facebook")?.name).toBe("facebook");
    expect(createAdapter("nonexistent")).toBeUndefined();
  });

  it("should have consistent category configs", () => {
    const categories = getAllCategories();
    for (const cat of categories) {
      const config = getCategoryConfig(cat.name);
      expect(config).toBeDefined();
      expect(config!.name).toBe(cat.name);
      expect(config!.searchTerms.length).toBeGreaterThan(0);
      expect(config!.typicalMarginPercent).toBeGreaterThan(0);
    }
  });

  it("should score and rank opportunities by profitability", async () => {
    const fb = new FacebookAdapter();
    const listings = await fb.search("test", { limit: 5 });

    const marketPrices = new Map([
      ["tradera", { avgPrice: 20000, medianPrice: 18000 }],
      ["ebay", { avgPrice: 22000, medianPrice: 20000 }],
    ]);

    const fees = { tradera: 0.1, ebay: 0.13, blocket: 0, facebook: 0 };
    const opps = findArbitrageOpportunities(listings, marketPrices, fees);

    // Should be sorted by score descending
    for (let i = 1; i < opps.length; i++) {
      expect(opps[i - 1].score).toBeGreaterThanOrEqual(opps[i].score);
    }
  });
});
