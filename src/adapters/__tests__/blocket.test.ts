import { describe, it, expect, vi, beforeEach } from "vitest";
import { BlocketAdapter } from "../blocket.js";
import type { Listing, ListingDetail } from "../../types.js";

// Mock the http module
vi.mock("../../utils/http.js", () => ({
  fetchPage: vi.fn(),
}));

import { fetchPage } from "../../utils/http.js";
const mockFetchPage = vi.mocked(fetchPage);

const SAMPLE_SEARCH_HTML = `
<html>
<body>
  <div data-testid="listing-card">
    <a href="/annons/stockholm/iphone-15-pro-128gb/12345">
      <h2>iPhone 15 Pro 128GB</h2>
    </a>
    <span data-testid="price">8 500 kr</span>
    <span data-testid="location">Stockholm</span>
    <img src="https://images.blocket.se/img1.jpg" alt="listing" />
  </div>
  <div data-testid="listing-card">
    <a href="/annons/goteborg/samsung-galaxy-s24/67890">
      <h2>Samsung Galaxy S24</h2>
    </a>
    <span data-testid="price">6 200 kr</span>
    <span data-testid="location">Göteborg</span>
    <img src="https://images.blocket.se/img2.jpg" alt="listing" />
  </div>
</body>
</html>
`;

const SAMPLE_DETAIL_HTML = `
<html>
<body>
  <h1>iPhone 15 Pro 128GB</h1>
  <span data-testid="price">8 500 kr</span>
  <div data-testid="description">
    Säljer min iPhone 15 Pro. Fint skick, inga repor. Laddare medföljer.
  </div>
  <span data-testid="location">Stockholm</span>
  <div data-testid="seller-name">Johan</div>
  <div data-testid="images">
    <img src="https://images.blocket.se/img1.jpg" />
    <img src="https://images.blocket.se/img2.jpg" />
  </div>
  <div data-testid="attribute" data-key="Skick">Begagnad</div>
</body>
</html>
`;

describe("BlocketAdapter", () => {
  let adapter: BlocketAdapter;

  beforeEach(() => {
    adapter = new BlocketAdapter();
    vi.clearAllMocks();
  });

  it("should have correct name", () => {
    expect(adapter.name).toBe("blocket");
  });

  describe("search", () => {
    it("should parse search results from HTML", async () => {
      mockFetchPage.mockResolvedValue(SAMPLE_SEARCH_HTML);

      const results = await adapter.search("iPhone");
      expect(results.length).toBe(2);
      expect(results[0].title).toBe("iPhone 15 Pro 128GB");
      expect(results[0].price).toBe(8500);
      expect(results[0].currency).toBe("SEK");
      expect(results[0].marketplace).toBe("blocket");
      expect(results[0].location).toBe("Stockholm");
    });

    it("should construct correct search URL", async () => {
      mockFetchPage.mockResolvedValue(SAMPLE_SEARCH_HTML);

      await adapter.search("laptop", { category: "electronics" });
      expect(mockFetchPage).toHaveBeenCalledWith(
        expect.stringContaining("laptop")
      );
    });

    it("should handle empty results", async () => {
      mockFetchPage.mockResolvedValue("<html><body></body></html>");

      const results = await adapter.search("nonexistent");
      expect(results).toEqual([]);
    });

    it("should handle network errors gracefully", async () => {
      mockFetchPage.mockRejectedValue(new Error("Network error"));

      const results = await adapter.search("test");
      expect(results).toEqual([]);
    });
  });

  describe("getListingDetails", () => {
    it("should parse listing detail page", async () => {
      mockFetchPage.mockResolvedValue(SAMPLE_DETAIL_HTML);

      const detail = await adapter.getListingDetails("12345");
      expect(detail.title).toBe("iPhone 15 Pro 128GB");
      expect(detail.price).toBe(8500);
      expect(detail.description).toContain("iPhone 15 Pro");
      expect(detail.marketplace).toBe("blocket");
    });

    it("should extract images", async () => {
      mockFetchPage.mockResolvedValue(SAMPLE_DETAIL_HTML);

      const detail = await adapter.getListingDetails("12345");
      expect(detail.images.length).toBeGreaterThan(0);
    });

    it("should handle missing detail page", async () => {
      mockFetchPage.mockRejectedValue(new Error("404"));

      await expect(adapter.getListingDetails("invalid")).rejects.toThrow();
    });
  });
});
