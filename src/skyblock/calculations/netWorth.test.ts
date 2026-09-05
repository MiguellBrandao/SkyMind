import { describe, expect, it } from "vitest";
import { estimateNetWorth } from "./netWorth";

describe("estimateNetWorth", () => {
  it("sums coins when there are no items", () => {
    const result = estimateNetWorth({ purseCoins: 1000, bankCoins: 2000, items: [], priceLookup: () => undefined });
    expect(result.estimatedTotal).toBe(3000);
    expect(result.confidence).toBe("high");
  });

  it("adds priced item value and reports high confidence when all items are priced", () => {
    const result = estimateNetWorth({
      purseCoins: 0,
      bankCoins: 0,
      items: [{ skyblockItemId: "WHEAT", count: 10 }],
      priceLookup: () => 5,
    });
    expect(result.itemsValue).toBe(50);
    expect(result.estimatedTotal).toBe(50);
    expect(result.confidence).toBe("high");
  });

  it("reports lower confidence as more items go unpriced", () => {
    const items = Array.from({ length: 10 }, (_, i) => ({ skyblockItemId: `ITEM_${i}`, count: 1 }));
    const result = estimateNetWorth({ purseCoins: 0, bankCoins: 0, items, priceLookup: () => undefined });
    expect(result.unpricedItemCount).toBe(10);
    expect(result.confidence).toBe("low");
  });

  it("ignores items with no skyblockItemId", () => {
    const result = estimateNetWorth({ purseCoins: 0, bankCoins: 0, items: [{ skyblockItemId: null, count: 5 }], priceLookup: () => 100 });
    expect(result.itemsValue).toBe(0);
    expect(result.pricedItemCount).toBe(0);
    expect(result.unpricedItemCount).toBe(0);
  });
});
