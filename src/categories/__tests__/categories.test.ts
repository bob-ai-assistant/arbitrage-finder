import { describe, it, expect } from "vitest";
import {
  CATEGORIES,
  getCategoryConfig,
  getAllCategories,
  getSearchTermsForCategory,
  getFeeForMarketplace,
} from "../index.js";
import type { ProductCategory } from "../../types.js";

describe("Categories", () => {
  describe("CATEGORIES", () => {
    it("should define all four product categories", () => {
      const names = Object.keys(CATEGORIES);
      expect(names).toContain("electronics");
      expect(names).toContain("furniture");
      expect(names).toContain("appliances");
      expect(names).toContain("collectibles");
      expect(names).toHaveLength(4);
    });

    it("each category should have required fields", () => {
      for (const cat of Object.values(CATEGORIES)) {
        expect(cat.name).toBeDefined();
        expect(cat.displayName).toBeDefined();
        expect(typeof cat.typicalMarginPercent).toBe("number");
        expect(typeof cat.avgDaysToSell).toBe("number");
        expect(cat.searchTerms.length).toBeGreaterThan(0);
        expect(cat.fees).toBeDefined();
      }
    });

    it("electronics should have relevant search terms", () => {
      const electronics = CATEGORIES.electronics;
      expect(electronics.searchTerms).toContain("iPhone");
      expect(electronics.searchTerms).toContain("laptop");
    });

    it("each category should have fees for known marketplaces", () => {
      for (const cat of Object.values(CATEGORIES)) {
        expect(cat.fees).toHaveProperty("tradera");
        expect(cat.fees).toHaveProperty("ebay");
        expect(cat.fees).toHaveProperty("blocket");
      }
    });
  });

  describe("getCategoryConfig", () => {
    it("should return config for a valid category", () => {
      const config = getCategoryConfig("electronics");
      expect(config).toBeDefined();
      expect(config!.name).toBe("electronics");
    });

    it("should return undefined for an invalid category", () => {
      const config = getCategoryConfig("nonexistent" as ProductCategory);
      expect(config).toBeUndefined();
    });
  });

  describe("getAllCategories", () => {
    it("should return all category configs as an array", () => {
      const all = getAllCategories();
      expect(all).toHaveLength(4);
      expect(all.map((c) => c.name)).toEqual(
        expect.arrayContaining(["electronics", "furniture", "appliances", "collectibles"])
      );
    });
  });

  describe("getSearchTermsForCategory", () => {
    it("should return search terms for a valid category", () => {
      const terms = getSearchTermsForCategory("collectibles");
      expect(terms.length).toBeGreaterThan(0);
    });

    it("should return empty array for invalid category", () => {
      const terms = getSearchTermsForCategory("nonexistent" as ProductCategory);
      expect(terms).toEqual([]);
    });
  });

  describe("getFeeForMarketplace", () => {
    it("should return the fee for tradera in electronics", () => {
      const fee = getFeeForMarketplace("electronics", "tradera");
      expect(fee).toBeCloseTo(0.1, 2);
    });

    it("should return the fee for ebay", () => {
      const fee = getFeeForMarketplace("electronics", "ebay");
      expect(fee).toBeCloseTo(0.13, 2);
    });

    it("should return 0 for blocket", () => {
      const fee = getFeeForMarketplace("electronics", "blocket");
      expect(fee).toBe(0);
    });

    it("should return 0 for unknown marketplace", () => {
      const fee = getFeeForMarketplace("electronics", "unknown");
      expect(fee).toBe(0);
    });

    it("should return 0 for unknown category", () => {
      const fee = getFeeForMarketplace("nonexistent" as ProductCategory, "tradera");
      expect(fee).toBe(0);
    });
  });
});
