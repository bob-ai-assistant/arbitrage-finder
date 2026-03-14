import type {
  Listing,
  MarketPriceData,
  ArbitrageOpportunity,
} from "../types.js";
import { CATEGORIES } from "../categories/index.js";

export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

export function computeMarketStats(
  listings: Listing[],
  query: string,
  marketplace: string
): MarketPriceData {
  if (listings.length === 0) {
    return {
      marketplace,
      query,
      avgPrice: 0,
      medianPrice: 0,
      minPrice: 0,
      maxPrice: 0,
      sampleSize: 0,
      fetchedAt: new Date(),
    };
  }

  const prices = listings.map((l) => l.price);
  const sum = prices.reduce((a, b) => a + b, 0);

  return {
    marketplace,
    query,
    avgPrice: sum / prices.length,
    medianPrice: calculateMedian(prices),
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    sampleSize: prices.length,
    fetchedAt: new Date(),
  };
}

export function scoreOpportunity(
  marginPercent: number,
  confidence: number,
  estimatedDaysToSell: number
): number {
  // Weighted score: margin (40%), confidence (35%), speed (25%)
  const marginScore = Math.min(marginPercent / 50, 1) * 40;
  const confidenceScore = confidence * 35;
  const speedScore = Math.max(0, 1 - estimatedDaysToSell / 60) * 25;
  return Math.min(100, Math.max(0, marginScore + confidenceScore + speedScore));
}

export function findArbitrageOpportunities(
  buyListings: Listing[],
  marketPrices: Map<string, { avgPrice: number; medianPrice: number }>,
  fees: Record<string, number>
): ArbitrageOpportunity[] {
  const opportunities: ArbitrageOpportunity[] = [];

  for (const listing of buyListings) {
    for (const [sellMarketplace, priceData] of marketPrices) {
      // Don't sell on the same marketplace you're buying from
      if (sellMarketplace === listing.marketplace) continue;

      const estimatedSellPrice = priceData.medianPrice;
      const feeRate = fees[sellMarketplace] ?? 0;
      const feeAmount = estimatedSellPrice * feeRate;
      const profit = estimatedSellPrice - feeAmount - listing.price;
      const marginPercent =
        listing.price > 0 ? (profit / listing.price) * 100 : 0;

      // Only include profitable opportunities
      if (profit <= 0) continue;

      // Calculate confidence based on price difference vs market
      const priceDiffRatio =
        priceData.avgPrice > 0
          ? listing.price / priceData.avgPrice
          : 1;
      const confidence = Math.min(1, Math.max(0.1, 1 - priceDiffRatio));

      // Estimate days to sell from category config or default
      const category = listing.category;
      const categoryConfig = category ? CATEGORIES[category] : undefined;
      const estimatedDaysToSell = categoryConfig?.avgDaysToSell ?? 14;

      const score = scoreOpportunity(
        marginPercent,
        confidence,
        estimatedDaysToSell
      );

      const reason =
        marginPercent >= 40
          ? "Significantly underpriced vs market average"
          : marginPercent >= 20
            ? "Good margin opportunity"
            : "Moderate arbitrage potential";

      opportunities.push({
        buyListing: listing,
        sellMarketplace,
        estimatedSellPrice,
        buyPrice: listing.price,
        fees: feeAmount,
        estimatedProfit: profit,
        marginPercent,
        confidence,
        estimatedDaysToSell,
        score,
        reason,
      });
    }
  }

  // Sort by score descending
  opportunities.sort((a, b) => b.score - a.score);
  return opportunities;
}
