export const SCHEMA = `
  CREATE TABLE IF NOT EXISTS listings (
    id TEXT PRIMARY KEY,
    marketplace TEXT NOT NULL,
    title TEXT NOT NULL,
    price REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'SEK',
    url TEXT NOT NULL,
    image_url TEXT,
    location TEXT,
    category TEXT,
    condition TEXT,
    posted_at TEXT,
    fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
    seller_name TEXT,
    seller_rating REAL
  );

  CREATE INDEX IF NOT EXISTS idx_listings_marketplace ON listings(marketplace);
  CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
  CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);

  CREATE TABLE IF NOT EXISTS price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query TEXT NOT NULL,
    marketplace TEXT NOT NULL,
    avg_price REAL NOT NULL,
    median_price REAL NOT NULL,
    min_price REAL NOT NULL,
    max_price REAL NOT NULL,
    sample_size INTEGER NOT NULL,
    fetched_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_price_history_query ON price_history(query, marketplace);

  CREATE TABLE IF NOT EXISTS opportunities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    buy_listing_id TEXT NOT NULL,
    sell_marketplace TEXT NOT NULL,
    buy_price REAL NOT NULL,
    estimated_sell_price REAL NOT NULL,
    fees REAL NOT NULL,
    estimated_profit REAL NOT NULL,
    margin_percent REAL NOT NULL,
    confidence REAL NOT NULL,
    score REAL NOT NULL,
    found_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (buy_listing_id) REFERENCES listings(id)
  );

  CREATE INDEX IF NOT EXISTS idx_opportunities_score ON opportunities(score DESC);
`;
