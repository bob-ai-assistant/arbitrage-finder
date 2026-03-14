// ============================================================
// Core types for the Arbitrage Finder
// ============================================================

export interface SearchOptions {
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  limit?: number;
  sortBy?: "price_asc" | "price_desc" | "date" | "relevance";
}

export interface Listing {
  id: string;
  marketplace: string;
  title: string;
  price: number;
  currency: string;
  url: string;
  imageUrl?: string;
  location?: string;
  category?: ProductCategory;
  condition?: ItemCondition;
  postedAt?: Date;
  seller?: SellerInfo;
}

export interface ListingDetail extends Listing {
  description: string;
  images: string[];
  attributes: Record<string, string>;
  sellerRating?: number;
  viewCount?: number;
}

export interface SellerInfo {
  name: string;
  rating?: number;
  memberSince?: string;
  listingCount?: number;
}

export type ItemCondition =
  | "new"
  | "like_new"
  | "good"
  | "fair"
  | "poor"
  | "unknown";

export type ProductCategory =
  | "electronics"
  | "furniture"
  | "appliances"
  | "collectibles";

export interface MarketplaceAdapter {
  name: string;
  search(query: string, options?: SearchOptions): Promise<Listing[]>;
  getListingDetails(id: string): Promise<ListingDetail>;
}

export interface ArbitrageOpportunity {
  buyListing: Listing;
  sellMarketplace: string;
  estimatedSellPrice: number;
  buyPrice: number;
  fees: number;
  estimatedProfit: number;
  marginPercent: number;
  confidence: number;
  estimatedDaysToSell: number;
  score: number;
  reason: string;
}

export interface MarketPriceData {
  marketplace: string;
  query: string;
  avgPrice: number;
  medianPrice: number;
  minPrice: number;
  maxPrice: number;
  sampleSize: number;
  fetchedAt: Date;
}

export interface AlertConfig {
  categories: ProductCategory[];
  minMarginPercent: number;
  minConfidence: number;
  maxBuyPrice?: number;
}

export interface CategoryConfig {
  name: ProductCategory;
  displayName: string;
  typicalMarginPercent: number;
  avgDaysToSell: number;
  searchTerms: string[];
  fees: Record<string, number>;
}

export interface AppConfig {
  rateLimitRpm: number;
  dbPath: string;
  minMarginPercent: number;
  minConfidence: number;
  requestTimeoutMs: number;
  userAgent: string;
  fees: Record<string, number>;
}
