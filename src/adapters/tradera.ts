import * as cheerio from "cheerio";
import { fetchPage } from "../utils/http.js";
import type {
  MarketplaceAdapter,
  Listing,
  ListingDetail,
  SearchOptions,
} from "../types.js";

function parseSwedishPrice(text: string): number {
  const cleaned = text.replace(/[^\d]/g, "");
  return parseInt(cleaned, 10) || 0;
}

export class TraderaAdapter implements MarketplaceAdapter {
  name = "tradera";

  async search(query: string, options?: SearchOptions): Promise<Listing[]> {
    try {
      const params = new URLSearchParams({ q: query });
      if (options?.minPrice) params.set("pMin", String(options.minPrice));
      if (options?.maxPrice) params.set("pMax", String(options.maxPrice));

      const url = `https://www.tradera.com/search?${params}`;
      const html = await fetchPage(url);
      const $ = cheerio.load(html);
      const listings: Listing[] = [];

      $(".item-card").each((_, el) => {
        const $el = $(el);
        const itemId = $el.attr("data-item-id") ?? `t-${Date.now()}`;
        const link = $el.find(".item-card-link");
        const href = link.attr("href") ?? "";
        const title = $el.find(".item-card-title").text().trim();
        const priceText = $el.find(".item-card-price").text().trim();

        if (title && priceText) {
          listings.push({
            id: itemId,
            marketplace: this.name,
            title,
            price: parseSwedishPrice(priceText),
            currency: "SEK",
            url: href.startsWith("http")
              ? href
              : `https://www.tradera.com${href}`,
            category: options?.category,
          });
        }
      });

      const limit = options?.limit ?? 50;
      return listings.slice(0, limit);
    } catch {
      return [];
    }
  }

  async getListingDetails(id: string): Promise<ListingDetail> {
    const numericId = id.replace("t-", "");
    const url = `https://www.tradera.com/item/${numericId}`;
    const html = await fetchPage(url);
    const $ = cheerio.load(html);

    const title = $(".item-title").first().text().trim();
    const priceText = $(".item-price").text().trim();
    const description = $(".item-description").text().trim();
    const sellerName = $(".seller-name").text().trim();
    const sellerRating = parseFloat($(".seller-rating").text().trim()) || undefined;
    const viewCount = parseInt($(".item-views").text().replace(/[^\d]/g, ""), 10) || undefined;

    const images: string[] = [];
    $(".item-images img").each((_, el) => {
      const src = $(el).attr("src");
      if (src) images.push(src);
    });

    const conditionText = $(".item-condition").text().trim().toLowerCase();
    const condition = conditionText.includes("ny")
      ? "new" as const
      : conditionText.includes("begagnad")
        ? "good" as const
        : "unknown" as const;

    return {
      id,
      marketplace: this.name,
      title,
      price: parseSwedishPrice(priceText),
      currency: "SEK",
      url,
      description,
      images,
      attributes: {},
      condition,
      viewCount,
      sellerRating,
      seller: sellerName ? { name: sellerName, rating: sellerRating } : undefined,
    };
  }
}
