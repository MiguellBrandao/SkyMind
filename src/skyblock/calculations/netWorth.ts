export interface NetWorthItemInput {
  skyblockItemId: string | null;
  count: number;
}

export interface NetWorthInput {
  purseCoins: number;
  bankCoins: number;
  items: NetWorthItemInput[];
  priceLookup: (skyblockItemId: string) => number | undefined;
}

export interface NetWorthResult {
  purseCoins: number;
  bankCoins: number;
  itemsValue: number;
  estimatedTotal: number;
  pricedItemCount: number;
  unpricedItemCount: number;
  confidence: "high" | "medium" | "low";
}

/**
 * Rough net-worth estimate: coins + sum(item count * best-known market price).
 * Only items with a resolvable bazaar/auction price contribute to itemsValue, so the
 * result is a floor estimate, not exact - confidence reflects how much of the inventory
 * could actually be priced.
 */
export function estimateNetWorth(input: NetWorthInput): NetWorthResult {
  let itemsValue = 0;
  let pricedItemCount = 0;
  let unpricedItemCount = 0;

  for (const item of input.items) {
    if (!item.skyblockItemId || item.count <= 0) continue;
    const price = input.priceLookup(item.skyblockItemId);
    if (price === undefined) {
      unpricedItemCount++;
      continue;
    }
    itemsValue += price * item.count;
    pricedItemCount++;
  }

  const total = pricedItemCount + unpricedItemCount;
  const unpricedRatio = total > 0 ? unpricedItemCount / total : 0;
  const confidence: NetWorthResult["confidence"] = unpricedRatio < 0.1 ? "high" : unpricedRatio < 0.4 ? "medium" : "low";

  return {
    purseCoins: Math.round(input.purseCoins),
    bankCoins: Math.round(input.bankCoins),
    itemsValue: Math.round(itemsValue),
    estimatedTotal: Math.round(input.purseCoins + input.bankCoins + itemsValue),
    pricedItemCount,
    unpricedItemCount,
    confidence,
  };
}
