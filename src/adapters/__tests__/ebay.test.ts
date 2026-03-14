import { describe, it, expect, vi, beforeEach } from "vitest";
import { EbayAdapter } from "../ebay.js";

vi.mock("../../utils/http.js", () => ({
  fetchPage: vi.fn(),
}));

import { fetchPage } from "../../utils/http.js";
const mockFetchPage = vi.mocked(fetchPage);

const SAMPLE_SEARCH_HTML = `
<html>
<body>
  <li class="s-item" data-view="mi:1686|iid:e-001">
    <a class="s-item__link" href="https://www.ebay.com/itm/001">
      <h3 class="s-item__title">Apple iPhone 15 Pro 128GB Unlocked</h3>
    </a>
    <span class="s-item__price">$749.99</span>
    <span class="s-item__location">United States</span>
    <span class="s-item__shipping">Free shipping</span>
  </li>
  <li class="s-item" data-view="mi:1686|iid:e-002">
    <a class="s-item__link" href="https://www.ebay.com/itm/002">
      <h3 class="s-item__title">Samsung Galaxy S24 Ultra 256GB</h3>
    </a>
    <span class="s-item__price">$899.00</span>
    <span class="s-item__location">Germany</span>
  </li>
</body>
</html>
`;

const SAMPLE_DETAIL_HTML = `
<html>
<body>
  <h1 class="x-item-title__mainTitle">Apple iPhone 15 Pro 128GB Unlocked</h1>
  <span class="x-price-primary">$749.99</span>
  <div class="x-item-description">
    Brand new, sealed in box. Full warranty. Ships worldwide.
  </div>
  <span class="x-seller-name">TechDeals2024</span>
  <span class="x-seller-rating">99.2%</span>
  <div class="x-item-images">
    <img src="https://i.ebayimg.com/iphone1.jpg" />
    <img src="https://i.ebayimg.com/iphone2.jpg" />
    <img src="https://i.ebayimg.com/iphone3.jpg" />
  </div>
  <span class="x-item-condition">New</span>
</body>
</html>
`;

describe("EbayAdapter", () => {
  let adapter: EbayAdapter;

  beforeEach(() => {
    adapter = new EbayAdapter();
    vi.clearAllMocks();
  });

  it("should have correct name", () => {
    expect(adapter.name).toBe("ebay");
  });

  describe("search", () => {
    it("should parse search results from HTML", async () => {
      mockFetchPage.mockResolvedValue(SAMPLE_SEARCH_HTML);

      const results = await adapter.search("iPhone");
      expect(results.length).toBe(2);
      expect(results[0].title).toBe("Apple iPhone 15 Pro 128GB Unlocked");
      expect(results[0].price).toBe(749.99);
      expect(results[0].currency).toBe("USD");
      expect(results[0].marketplace).toBe("ebay");
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

      const detail = await adapter.getListingDetails("001");
      expect(detail.title).toBe("Apple iPhone 15 Pro 128GB Unlocked");
      expect(detail.price).toBe(749.99);
      expect(detail.description).toContain("sealed in box");
      expect(detail.marketplace).toBe("ebay");
    });

    it("should extract seller info", async () => {
      mockFetchPage.mockResolvedValue(SAMPLE_DETAIL_HTML);
      const detail = await adapter.getListingDetails("001");
      expect(detail.seller?.name).toBe("TechDeals2024");
    });

    it("should extract images", async () => {
      mockFetchPage.mockResolvedValue(SAMPLE_DETAIL_HTML);
      const detail = await adapter.getListingDetails("001");
      expect(detail.images.length).toBe(3);
    });

    it("should handle errors", async () => {
      mockFetchPage.mockRejectedValue(new Error("404"));
      await expect(adapter.getListingDetails("bad")).rejects.toThrow();
    });
  });
});
