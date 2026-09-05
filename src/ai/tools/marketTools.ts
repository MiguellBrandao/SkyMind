import { z } from "zod";
import { marketService } from "../../skyblock/services/marketService";
import { defineTool } from "./types";

export const getBazaarPriceTool = defineTool({
  name: "get_bazaar_price",
  description: "Gets the current live Bazaar buy/sell price for a tradeable SkyBlock item by its internal item ID (e.g. 'ENCHANTED_LAPIS_BLOCK'). Use search_skyblock_knowledge first if you don't know the exact item ID.",
  category: "market",
  schema: z.object({
    itemId: z.string().min(1).describe("The internal SkyBlock/Bazaar item ID, e.g. 'WHEAT' or 'ENCHANTED_DIAMOND'."),
  }),
  handler: async (args) => {
    const price = await marketService.getBazaarPrice(args.itemId);
    if (!price) {
      const suggestions = await marketService.searchBazaarProducts(args.itemId, 5);
      return { found: false, message: `No bazaar product found for ID '${args.itemId}'.`, suggestions: suggestions.map((s) => s.productId) };
    }
    return { found: true, ...price };
  },
});

export const getAuctionPricesTool = defineTool({
  name: "get_auction_prices",
  description: "Searches currently active Auction House listings by item name and returns the lowest BIN price, a median price, and a few sample listings. Best for unique/rare items not sold on the Bazaar (e.g. weapons, armor, pets).",
  category: "market",
  schema: z.object({
    itemName: z.string().min(1).describe("Item display name (or partial name) to search for, e.g. 'Hyperion' or 'Midas' Staff'."),
    binOnly: z.boolean().optional().default(true).describe("Whether to only consider Buy-It-Now listings (recommended for reliable price checks)."),
  }),
  handler: async (args) => {
    const stats = await marketService.getAuctionStats(args.itemName, { binOnly: args.binOnly });
    if (!stats) {
      return { found: false, message: `No active auctions found matching '${args.itemName}'.` };
    }
    return { found: true, ...stats };
  },
});
