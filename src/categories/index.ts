import type { CategoryConfig, ProductCategory } from "../types.js";

export const CATEGORIES: Record<ProductCategory, CategoryConfig> = {
  electronics: {
    name: "electronics",
    displayName: "Electronics",
    typicalMarginPercent: 25,
    avgDaysToSell: 7,
    searchTerms: [
      "iPhone",
      "Samsung Galaxy",
      "laptop",
      "MacBook",
      "PlayStation",
      "Xbox",
      "Nintendo Switch",
      "iPad",
      "AirPods",
      "gaming PC",
    ],
    fees: {
      tradera: 0.10,
      ebay: 0.13,
      blocket: 0.0,
      facebook: 0.0,
    },
  },
  furniture: {
    name: "furniture",
    displayName: "Furniture",
    typicalMarginPercent: 35,
    avgDaysToSell: 14,
    searchTerms: [
      "Eames",
      "Hans Wegner",
      "IKEA Stockholm",
      "vintage skänk",
      "designfåtölj",
      "antikt bord",
      "retro lampa",
      "dansk design",
    ],
    fees: {
      tradera: 0.10,
      ebay: 0.13,
      blocket: 0.0,
      facebook: 0.0,
    },
  },
  appliances: {
    name: "appliances",
    displayName: "Appliances",
    typicalMarginPercent: 20,
    avgDaysToSell: 10,
    searchTerms: [
      "tvättmaskin",
      "kylskåp",
      "diskmaskin",
      "dammsugare Dyson",
      "espressomaskin",
      "Thermomix",
      "KitchenAid",
      "robotdammsugare",
    ],
    fees: {
      tradera: 0.10,
      ebay: 0.13,
      blocket: 0.0,
      facebook: 0.0,
    },
  },
  collectibles: {
    name: "collectibles",
    displayName: "Collectibles",
    typicalMarginPercent: 40,
    avgDaysToSell: 21,
    searchTerms: [
      "vinyl LP",
      "retro spel",
      "Nintendo NES",
      "SNES",
      "Rolex",
      "Omega Seamaster",
      "Pokemon kort",
      "LEGO Star Wars",
      "vintage klocka",
    ],
    fees: {
      tradera: 0.10,
      ebay: 0.13,
      blocket: 0.0,
      facebook: 0.0,
    },
  },
};

export function getCategoryConfig(
  category: ProductCategory
): CategoryConfig | undefined {
  return CATEGORIES[category];
}

export function getAllCategories(): CategoryConfig[] {
  return Object.values(CATEGORIES);
}

export function getSearchTermsForCategory(
  category: ProductCategory
): string[] {
  const config = CATEGORIES[category];
  return config?.searchTerms ?? [];
}

export function getFeeForMarketplace(
  category: ProductCategory,
  marketplace: string
): number {
  const config = CATEGORIES[category];
  if (!config) return 0;
  return config.fees[marketplace] ?? 0;
}
