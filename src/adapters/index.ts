import type { MarketplaceAdapter } from "../types.js";
import { BlocketAdapter } from "./blocket.js";
import { TraderaAdapter } from "./tradera.js";
import { EbayAdapter } from "./ebay.js";
import { FacebookAdapter } from "./facebook.js";

export { BlocketAdapter } from "./blocket.js";
export { TraderaAdapter } from "./tradera.js";
export { EbayAdapter } from "./ebay.js";
export { FacebookAdapter } from "./facebook.js";

export function createAllAdapters(): MarketplaceAdapter[] {
  return [
    new BlocketAdapter(),
    new TraderaAdapter(),
    new EbayAdapter(),
    new FacebookAdapter(),
  ];
}

export function createAdapter(name: string): MarketplaceAdapter | undefined {
  switch (name.toLowerCase()) {
    case "blocket":
      return new BlocketAdapter();
    case "tradera":
      return new TraderaAdapter();
    case "ebay":
      return new EbayAdapter();
    case "facebook":
      return new FacebookAdapter();
    default:
      return undefined;
  }
}
