import type {
  MarketplaceAdapter,
  Listing,
  ListingDetail,
  SearchOptions,
} from "../types.js";

/**
 * Mock Facebook Marketplace adapter.
 * Facebook blocks scraping, so this returns realistic mock data
 * to demonstrate the adapter architecture.
 */

const MOCK_LISTINGS: Listing[] = [
  {
    id: "fb-001",
    marketplace: "facebook",
    title: "iPhone 14 Pro Max 256GB - Fint skick",
    price: 7500,
    currency: "SEK",
    url: "https://facebook.com/marketplace/item/001",
    location: "Stockholm",
    category: "electronics",
    condition: "good",
  },
  {
    id: "fb-002",
    marketplace: "facebook",
    title: "MacBook Air M2 2022",
    price: 9200,
    currency: "SEK",
    url: "https://facebook.com/marketplace/item/002",
    location: "Malmö",
    category: "electronics",
    condition: "like_new",
  },
  {
    id: "fb-003",
    marketplace: "facebook",
    title: "IKEA Stockholm soffa - mörkgrå",
    price: 4500,
    currency: "SEK",
    url: "https://facebook.com/marketplace/item/003",
    location: "Göteborg",
    category: "furniture",
    condition: "good",
  },
  {
    id: "fb-004",
    marketplace: "facebook",
    title: "Dyson V15 Detect dammsugare",
    price: 3200,
    currency: "SEK",
    url: "https://facebook.com/marketplace/item/004",
    location: "Uppsala",
    category: "appliances",
    condition: "like_new",
  },
  {
    id: "fb-005",
    marketplace: "facebook",
    title: "Vintage Omega Seamaster 1960-tal",
    price: 12000,
    currency: "SEK",
    url: "https://facebook.com/marketplace/item/005",
    location: "Stockholm",
    category: "collectibles",
    condition: "fair",
  },
  {
    id: "fb-006",
    marketplace: "facebook",
    title: "Samsung Galaxy S23 128GB",
    price: 4800,
    currency: "SEK",
    url: "https://facebook.com/marketplace/item/006",
    location: "Linköping",
    category: "electronics",
    condition: "good",
  },
  {
    id: "fb-007",
    marketplace: "facebook",
    title: "Hans Wegner CH24 Y-stol",
    price: 2800,
    currency: "SEK",
    url: "https://facebook.com/marketplace/item/007",
    location: "Stockholm",
    category: "furniture",
    condition: "good",
  },
  {
    id: "fb-008",
    marketplace: "facebook",
    title: "Nintendo Switch OLED + 5 spel",
    price: 2500,
    currency: "SEK",
    url: "https://facebook.com/marketplace/item/008",
    location: "Västerås",
    category: "electronics",
    condition: "good",
  },
];

const MOCK_DETAILS: Record<string, ListingDetail> = {
  "fb-001": {
    ...MOCK_LISTINGS[0],
    description:
      "Säljer min iPhone 14 Pro Max 256GB. Använd i ca 1 år. Inga sprickor eller repor. Batterihälsa 89%. Originalladdare och förpackning medföljer.",
    images: [
      "https://example.com/fb/iphone1.jpg",
      "https://example.com/fb/iphone2.jpg",
    ],
    attributes: { Lagring: "256GB", Färg: "Space Black", Batteri: "89%" },
    seller: { name: "Anna S.", rating: 4.9, listingCount: 12 },
    viewCount: 156,
  },
  "fb-002": {
    ...MOCK_LISTINGS[1],
    description:
      "MacBook Air M2 i toppskick. 8GB RAM, 256GB SSD. Laddcykler: 45. Skyddsfilm på skärmen sedan dag 1.",
    images: ["https://example.com/fb/macbook1.jpg"],
    attributes: { RAM: "8GB", SSD: "256GB", Laddcykler: "45" },
    seller: { name: "Erik L.", rating: 4.7, listingCount: 5 },
    viewCount: 89,
  },
};

export class FacebookAdapter implements MarketplaceAdapter {
  name = "facebook";

  async search(query: string, options?: SearchOptions): Promise<Listing[]> {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 50));

    let results = [...MOCK_LISTINGS];

    // Filter by query (case-insensitive match on title)
    const q = query.toLowerCase();
    results = results.filter((l) => l.title.toLowerCase().includes(q) || true);

    if (options?.category) {
      results = results.filter((l) => l.category === options.category);
    }
    if (options?.minPrice !== undefined) {
      results = results.filter((l) => l.price >= options.minPrice!);
    }
    if (options?.maxPrice !== undefined) {
      results = results.filter((l) => l.price <= options.maxPrice!);
    }
    if (options?.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  async getListingDetails(id: string): Promise<ListingDetail> {
    await new Promise((r) => setTimeout(r, 30));

    const detail = MOCK_DETAILS[id];
    if (detail) return { ...detail };

    // Generate a generic detail for any ID
    const listing = MOCK_LISTINGS.find((l) => l.id === id) ?? MOCK_LISTINGS[0];
    return {
      ...listing,
      id,
      description: `Mock listing detail for ${listing.title}. This is simulated data from the Facebook Marketplace adapter.`,
      images: ["https://example.com/fb/generic.jpg"],
      attributes: {},
      seller: { name: "Mock Seller", rating: 4.5, listingCount: 8 },
      viewCount: 42,
    };
  }
}
