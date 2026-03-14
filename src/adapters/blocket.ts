import * as cheerio from "cheerio";
import { fetchPage } from "../utils/http.js";
import type {
  MarketplaceAdapter,
  Listing,
  ListingDetail,
  SearchOptions,
} from "../types.js";

function parseSwedishPrice(text: string): number {
  // "8 500 kr" → 8500
  const cleaned = text.replace(/[^\d]/g, "");
  return parseInt(cleaned, 10) || 0;
}

export class BlocketAdapter implements MarketplaceAdapter {
  name = "blocket";

  async search(query: string, options?: SearchOptions): Promise<Listing[]> {
    try {
      const params = new URLSearchParams({ q: query });
      if (options?.minPrice) params.set("price_from", String(options.minPrice));
      if (options?.maxPrice) params.set("price_to", String(options.maxPrice));
      if (options?.sortBy === "price_asc") params.set("sort", "price");

      const url = `https://www.blocket.se/annonser/hela_sverige?${params}`;
      const html = await fetchPage(url);
      const $ = cheerio.load(html);
      const listings: Listing[] = [];

      $('[data-testid="listing-card"]').each((_, el) => {
        const $el = $(el);
        const link = $el.find("a");
        const href = link.attr("href") ?? "";
        const title = $el.find("h2").text().trim();
        const priceText = $el.find('[data-testid="price"]').text().trim();
        const location = $el.find('[data-testid="location"]').text().trim();
        const imageUrl = $el.find("img").attr("src");

        const idMatch = href.match(/\/(\d+)$/);
        const id = idMatch ? `blocket-${idMatch[1]}` : `blocket-${Date.now()}`;

        if (title && priceText) {
          listings.push({
            id,
            marketplace: this.name,
            title,
            price: parseSwedishPrice(priceText),
            currency: "SEK",
            url: href.startsWith("http")
              ? href
              : `https://www.blocket.se${href}`,
            imageUrl,
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
    const numericId = id.replace("blocket-", "");
    const url = `https://www.blocket.se/annons/${numericId}`;
    const html = await fetchPage(url);
    const $ = cheerio.load(html);

    const title = $("h1").first().text().trim();
    const priceText = $('[data-testid="price"]').text().trim();
    const description = $('[data-testid="description"]').text().trim();
    const location = $('[data-testid="location"]').text().trim();
    const sellerName = $('[data-testid="seller-name"]').text().trim();

    const images: string[] = [];
    $('[data-testid="images"] img').each((_, el) => {
      const src = $(el).attr("src");
      if (src) images.push(src);
    });

    const attributes: Record<string, string> = {};
    $('[data-testid="attribute"]').each((_, el) => {
      const key = $(el).attr("data-key");
      const value = $(el).text().trim();
      if (key) attributes[key] = value;
    });

    return {
      id: `blocket-${numericId}`,
      marketplace: this.name,
      title,
      price: parseSwedishPrice(priceText),
      currency: "SEK",
      url,
      description,
      images,
      attributes,
      location: location || undefined,
      seller: sellerName ? { name: sellerName } : undefined,
    };
  }
}
