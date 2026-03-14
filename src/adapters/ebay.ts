import * as cheerio from "cheerio";
import { fetchPage } from "../utils/http.js";
import type {
  MarketplaceAdapter,
  Listing,
  ListingDetail,
  SearchOptions,
} from "../types.js";

function parseUsdPrice(text: string): number {
  // "$749.99" → 749.99
  const cleaned = text.replace(/[^0-9.]/g, "");
  return parseFloat(cleaned) || 0;
}

export class EbayAdapter implements MarketplaceAdapter {
  name = "ebay";

  async search(query: string, options?: SearchOptions): Promise<Listing[]> {
    try {
      const params = new URLSearchParams({ _nkw: query });
      if (options?.minPrice) params.set("_udlo", String(options.minPrice));
      if (options?.maxPrice) params.set("_udhi", String(options.maxPrice));
      if (options?.sortBy === "price_asc") params.set("_sop", "15");

      const url = `https://www.ebay.com/sch/i.html?${params}`;
      const html = await fetchPage(url);
      const $ = cheerio.load(html);
      const listings: Listing[] = [];

      $(".s-item").each((_, el) => {
        const $el = $(el);
        const link = $el.find(".s-item__link");
        const href = link.attr("href") ?? "";
        const title = $el.find(".s-item__title").text().trim();
        const priceText = $el.find(".s-item__price").text().trim();
        const location = $el.find(".s-item__location").text().trim();

        // Extract item ID from URL or data attribute
        const dataView = $el.attr("data-view") ?? "";
        const iidMatch = dataView.match(/iid:(e-\d+)/);
        const id = iidMatch ? iidMatch[1] : `ebay-${Date.now()}`;

        if (title && priceText) {
          listings.push({
            id,
            marketplace: this.name,
            title,
            price: parseUsdPrice(priceText),
            currency: "USD",
            url: href,
            location: location || undefined,
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
    const url = `https://www.ebay.com/itm/${id.replace("ebay-", "")}`;
    const html = await fetchPage(url);
    const $ = cheerio.load(html);

    const title = $(".x-item-title__mainTitle").first().text().trim();
    const priceText = $(".x-price-primary").text().trim();
    const description = $(".x-item-description").text().trim();
    const sellerName = $(".x-seller-name").text().trim();
    const sellerRatingText = $(".x-seller-rating").text().trim();
    const sellerRating = parseFloat(sellerRatingText) || undefined;

    const images: string[] = [];
    $(".x-item-images img").each((_, el) => {
      const src = $(el).attr("src");
      if (src) images.push(src);
    });

    const conditionText = $(".x-item-condition").text().trim().toLowerCase();
    const condition = conditionText.includes("new")
      ? "new" as const
      : conditionText.includes("used")
        ? "good" as const
        : "unknown" as const;

    return {
      id,
      marketplace: this.name,
      title,
      price: parseUsdPrice(priceText),
      currency: "USD",
      url,
      description,
      images,
      attributes: {},
      condition,
      sellerRating,
      seller: sellerName ? { name: sellerName, rating: sellerRating } : undefined,
    };
  }
}
