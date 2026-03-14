import { describe, it, expect, vi, beforeEach } from "vitest";
import { TraderaAdapter } from "../tradera.js";

vi.mock("../../utils/http.js", () => ({
  fetchPage: vi.fn(),
}));

import { fetchPage } from "../../utils/http.js";
const mockFetchPage = vi.mocked(fetchPage);

const SAMPLE_SEARCH_HTML = `
<html>
<body>
  <div class="item-card" data-item-id="t-001">
    <a class="item-card-link" href="/item/001/retro-nintendo-nes-konsol">
      <span class="item-card-title">Retro Nintendo NES Konsol</span>
    </a>
    <span class="item-card-price">1 200 kr</span>
    <span class="item-card-bids">5 bud</span>
  </div>
  <div class="item-card" data-item-id="t-002">
    <a class="item-card-link" href="/item/002/pokemon-kort-charizard">
      <span class="item-card-title">Pokemon Kort Charizard</span>
    </a>
    <span class="item-card-price">3 500 kr</span>
    <span class="item-card-bids">12 bud</span>
  </div>
</body>
</html>
`;

const SAMPLE_DETAIL_HTML = `
<html>
<body>
  <h1 class="item-title">Retro Nintendo NES Konsol</h1>
  <span class="item-price">1 200 kr</span>
  <div class="item-description">
    Original NES konsol med två kontroller och 3 spel. Testad och fungerar.
  </div>
  <span class="seller-name">RetroGamer42</span>
  <span class="seller-rating">4.8</span>
  <div class="item-images">
    <img src="https://img.tradera.net/nes1.jpg" />
    <img src="https://img.tradera.net/nes2.jpg" />
  </div>
  <span class="item-condition">Begagnad</span>
  <span class="item-views">234</span>
</body>
</html>
`;

describe("TraderaAdapter", () => {
  let adapter: TraderaAdapter;

  beforeEach(() => {
    adapter = new TraderaAdapter();
    vi.clearAllMocks();
  });

  it("should have correct name", () => {
    expect(adapter.name).toBe("tradera");
  });

  describe("search", () => {
    it("should parse search results from HTML", async () => {
      mockFetchPage.mockResolvedValue(SAMPLE_SEARCH_HTML);

      const results = await adapter.search("Nintendo");
      expect(results.length).toBe(2);
      expect(results[0].title).toBe("Retro Nintendo NES Konsol");
      expect(results[0].price).toBe(1200);
      expect(results[0].currency).toBe("SEK");
      expect(results[0].marketplace).toBe("tradera");
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
      expect(detail.title).toBe("Retro Nintendo NES Konsol");
      expect(detail.price).toBe(1200);
      expect(detail.description).toContain("NES konsol");
      expect(detail.marketplace).toBe("tradera");
    });

    it("should extract seller info", async () => {
      mockFetchPage.mockResolvedValue(SAMPLE_DETAIL_HTML);
      const detail = await adapter.getListingDetails("001");
      expect(detail.seller?.name).toBe("RetroGamer42");
      expect(detail.sellerRating).toBe(4.8);
    });

    it("should extract images", async () => {
      mockFetchPage.mockResolvedValue(SAMPLE_DETAIL_HTML);
      const detail = await adapter.getListingDetails("001");
      expect(detail.images.length).toBe(2);
    });

    it("should handle errors", async () => {
      mockFetchPage.mockRejectedValue(new Error("404"));
      await expect(adapter.getListingDetails("bad")).rejects.toThrow();
    });
  });
});
