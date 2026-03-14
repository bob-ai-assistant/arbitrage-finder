import type {
  ArbitrageOpportunity,
  AlertConfig,
  ProductCategory,
} from "../types.js";

export function createDefaultAlertConfig(): AlertConfig {
  return {
    categories: [
      "electronics",
      "furniture",
      "appliances",
      "collectibles",
    ] as ProductCategory[],
    minMarginPercent: 15,
    minConfidence: 0.5,
  };
}

export function filterOpportunities(
  opportunities: ArbitrageOpportunity[],
  config: AlertConfig
): ArbitrageOpportunity[] {
  return opportunities.filter((opp) => {
    if (opp.marginPercent < config.minMarginPercent) return false;
    if (opp.confidence < config.minConfidence) return false;
    if (config.maxBuyPrice && opp.buyPrice > config.maxBuyPrice) return false;

    // Filter by category if the listing has one
    if (opp.buyListing.category) {
      if (!config.categories.includes(opp.buyListing.category)) return false;
    }

    return true;
  });
}

export function formatAlertJson(
  opportunities: ArbitrageOpportunity[]
): string {
  const output = {
    timestamp: new Date().toISOString(),
    totalOpportunities: opportunities.length,
    opportunities: opportunities.map((opp) => ({
      title: opp.buyListing.title,
      buyMarketplace: opp.buyListing.marketplace,
      sellMarketplace: opp.sellMarketplace,
      buyPrice: opp.buyPrice,
      estimatedSellPrice: opp.estimatedSellPrice,
      fees: opp.fees,
      estimatedProfit: opp.estimatedProfit,
      marginPercent: Math.round(opp.marginPercent * 10) / 10,
      confidence: Math.round(opp.confidence * 100) / 100,
      score: Math.round(opp.score),
      estimatedDaysToSell: opp.estimatedDaysToSell,
      reason: opp.reason,
      url: opp.buyListing.url,
    })),
  };

  return JSON.stringify(output, null, 2);
}
