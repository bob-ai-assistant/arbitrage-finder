import { describe, it, expect, beforeEach } from "vitest";
import { FacebookAdapter } from "../facebook.js";

describe("FacebookAdapter", () => {
  let adapter: FacebookAdapter;

  beforeEach(() => {
    adapter = new FacebookAdapter();
  });

  it("should have correct name", () => {
    expect(adapter.name).toBe("facebook");
  });

  describe("search", () => {
    it("should return mock listings", async () => {
      const results = await adapter.search("iPhone");
      expect(results.length).toBeGreaterThan(0);
      for (const listing of results) {
        expect(listing.marketplace).toBe("facebook");
        expect(listing.price).toBeGreaterThan(0);
        expect(listing.title).toBeDefined();
        expect(listing.currency).toBe("SEK");
      }
    });

    it("should filter by category when provided", async () => {
      const results = await adapter.search("laptop", {
        category: "electronics",
      });
      expect(results.length).toBeGreaterThan(0);
    });

    it("should respect price filters", async () => {
      const results = await adapter.search("phone", {
        minPrice: 1000,
        maxPrice: 5000,
      });
      for (const listing of results) {
        expect(listing.price).toBeGreaterThanOrEqual(1000);
        expect(listing.price).toBeLessThanOrEqual(5000);
      }
    });

    it("should respect limit option", async () => {
      const results = await adapter.search("test", { limit: 2 });
      expect(results.length).toBeLessThanOrEqual(2);
    });
  });

  describe("getListingDetails", () => {
    it("should return mock listing details", async () => {
      const detail = await adapter.getListingDetails("fb-001");
      expect(detail.marketplace).toBe("facebook");
      expect(detail.description).toBeDefined();
      expect(detail.images.length).toBeGreaterThan(0);
    });

    it("should include seller info", async () => {
      const detail = await adapter.getListingDetails("fb-001");
      expect(detail.seller).toBeDefined();
      expect(detail.seller?.name).toBeDefined();
    });
  });
});
