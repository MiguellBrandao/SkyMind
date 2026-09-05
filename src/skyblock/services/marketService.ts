import { hypixelClient } from "../../hypixel/client/HypixelClient";
import type { BazaarProduct } from "../../hypixel/client/types";

export interface BazaarPriceInfo {
  productId: string;
  buyPrice: number | null;
  sellPrice: number | null;
}

export interface AuctionStatsResult {
  query: string;
  matchCount: number;
  lowestBinPrice: number | null;
  medianPrice: number | null;
  sample: { itemName: string | undefined; price: number | undefined; bin: boolean }[];
}

export const marketService = {
  async getBazaarPrice(productId: string): Promise<BazaarPriceInfo | null> {
    const bazaar = await hypixelClient.getBazaar();
    const product = bazaar.products?.[productId.toUpperCase()];
    if (!product) return null;
    return {
      productId,
      buyPrice: product.quick_status?.buyPrice ?? null,
      sellPrice: product.quick_status?.sellPrice ?? null,
    };
  },

  async searchBazaarProducts(query: string, limit = 10): Promise<BazaarPriceInfo[]> {
    const bazaar = await hypixelClient.getBazaar();
    const q = query.toUpperCase();
    return Object.entries(bazaar.products ?? {})
      .filter(([id]) => id.includes(q))
      .slice(0, limit)
      .map(([id, product]) => ({
        productId: id,
        buyPrice: product.quick_status?.buyPrice ?? null,
        sellPrice: product.quick_status?.sellPrice ?? null,
      }));
  },

  /** Scans the (cached, page-capped) active auction index for items whose name matches the query. */
  async getAuctionStats(itemNameQuery: string, options: { binOnly?: boolean; sampleLimit?: number } = {}): Promise<AuctionStatsResult | null> {
    const auctions = await hypixelClient.buildAuctionIndex();
    const q = itemNameQuery.toLowerCase();
    const matches = auctions.filter((a) => (a.item_name?.toLowerCase().includes(q) ?? false) && (!options.binOnly || a.bin));
    if (matches.length === 0) return null;

    const prices = matches
      .map((a) => (a.bin ? a.starting_bid ?? 0 : a.highest_bid_amount ?? a.starting_bid ?? 0))
      .filter((p) => p > 0)
      .sort((a, b) => a - b);

    return {
      query: itemNameQuery,
      matchCount: matches.length,
      lowestBinPrice: prices[0] ?? null,
      medianPrice: prices.length > 0 ? (prices[Math.floor(prices.length / 2)] ?? null) : null,
      sample: matches.slice(0, options.sampleLimit ?? 5).map((a) => ({
        itemName: a.item_name,
        price: a.bin ? a.starting_bid : (a.highest_bid_amount ?? a.starting_bid),
        bin: a.bin ?? false,
      })),
    };
  },

  buildBazaarPriceLookup(products: Record<string, BazaarProduct>): (skyblockItemId: string) => number | undefined {
    return (skyblockItemId: string) => products[skyblockItemId.toUpperCase()]?.quick_status?.sellPrice;
  },
};
