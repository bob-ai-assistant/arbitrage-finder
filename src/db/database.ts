import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { dirname } from "path";
import { config } from "../config.js";
import { SCHEMA } from "./schema.js";
import type {
  Listing,
  MarketPriceData,
  ArbitrageOpportunity,
} from "../types.js";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  mkdirSync(dirname(config.dbPath), { recursive: true });
  db = new Database(config.dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(SCHEMA);
  return db;
}

export function saveListing(listing: Listing): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO listings
      (id, marketplace, title, price, currency, url, image_url, location, category, condition, posted_at, seller_name, seller_rating)
    VALUES
      (@id, @marketplace, @title, @price, @currency, @url, @imageUrl, @location, @category, @condition, @postedAt, @sellerName, @sellerRating)
  `);

  stmt.run({
    id: listing.id,
    marketplace: listing.marketplace,
    title: listing.title,
    price: listing.price,
    currency: listing.currency,
    url: listing.url,
    imageUrl: listing.imageUrl ?? null,
    location: listing.location ?? null,
    category: listing.category ?? null,
    condition: listing.condition ?? null,
    postedAt: listing.postedAt?.toISOString() ?? null,
    sellerName: listing.seller?.name ?? null,
    sellerRating: listing.seller?.rating ?? null,
  });
}

export function saveListings(listings: Listing[]): void {
  const db = getDb();
  const transaction = db.transaction(() => {
    for (const listing of listings) {
      saveListing(listing);
    }
  });
  transaction();
}

export function savePriceData(data: MarketPriceData): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO price_history (query, marketplace, avg_price, median_price, min_price, max_price, sample_size)
    VALUES (@query, @marketplace, @avgPrice, @medianPrice, @minPrice, @maxPrice, @sampleSize)
  `).run({
    query: data.query,
    marketplace: data.marketplace,
    avgPrice: data.avgPrice,
    medianPrice: data.medianPrice,
    minPrice: data.minPrice,
    maxPrice: data.maxPrice,
    sampleSize: data.sampleSize,
  });
}

export function getRecentPriceData(
  query: string,
  marketplace: string,
  maxAgeHours: number = 24
): MarketPriceData | null {
  const db = getDb();
  const row = db
    .prepare(
      `
    SELECT * FROM price_history
    WHERE query = ? AND marketplace = ?
      AND fetched_at > datetime('now', '-' || ? || ' hours')
    ORDER BY fetched_at DESC
    LIMIT 1
  `
    )
    .get(query, marketplace, maxAgeHours) as Record<string, unknown> | undefined;

  if (!row) return null;

  return {
    marketplace: row.marketplace as string,
    query: row.query as string,
    avgPrice: row.avg_price as number,
    medianPrice: row.median_price as number,
    minPrice: row.min_price as number,
    maxPrice: row.max_price as number,
    sampleSize: row.sample_size as number,
    fetchedAt: new Date(row.fetched_at as string),
  };
}

export function saveOpportunity(opp: ArbitrageOpportunity): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO opportunities
      (buy_listing_id, sell_marketplace, buy_price, estimated_sell_price, fees, estimated_profit, margin_percent, confidence, score)
    VALUES
      (@buyListingId, @sellMarketplace, @buyPrice, @estimatedSellPrice, @fees, @estimatedProfit, @marginPercent, @confidence, @score)
  `).run({
    buyListingId: opp.buyListing.id,
    sellMarketplace: opp.sellMarketplace,
    buyPrice: opp.buyPrice,
    estimatedSellPrice: opp.estimatedSellPrice,
    fees: opp.fees,
    estimatedProfit: opp.estimatedProfit,
    marginPercent: opp.marginPercent,
    confidence: opp.confidence,
    score: opp.score,
  });
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
