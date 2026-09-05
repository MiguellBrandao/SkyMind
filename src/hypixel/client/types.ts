import { z } from "zod";

export const hypixelPlayerSchema = z.object({
  success: z.boolean(),
  player: z
    .object({
      uuid: z.string(),
      displayname: z.string().optional(),
      firstLogin: z.number().optional(),
      lastLogin: z.number().optional(),
      lastLogout: z.number().optional(),
      networkExp: z.number().optional(),
      karma: z.number().optional(),
      socialMedia: z
        .object({
          links: z.record(z.string(), z.string()).optional(),
        })
        .optional(),
    })
    .nullable()
    .optional(),
  cause: z.string().optional(),
});
export type HypixelPlayerResponse = z.infer<typeof hypixelPlayerSchema>;

const skyblockMemberSchema = z.record(z.string(), z.unknown());

const skyblockProfileEntrySchema = z.object({
  profile_id: z.string(),
  cute_name: z.string().optional(),
  selected: z.boolean().optional(),
  game_mode: z.string().optional(),
  members: z.record(z.string(), skyblockMemberSchema),
  banking: z.object({ balance: z.number().optional() }).optional(),
});
export type SkyblockProfileEntry = z.infer<typeof skyblockProfileEntrySchema>;

export const hypixelProfilesSchema = z.object({
  success: z.boolean(),
  profiles: z.array(skyblockProfileEntrySchema).nullable().optional(),
  cause: z.string().optional(),
});
export type HypixelProfilesResponse = z.infer<typeof hypixelProfilesSchema>;

export const hypixelProfileSchema = z.object({
  success: z.boolean(),
  profile: skyblockProfileEntrySchema.nullable().optional(),
  cause: z.string().optional(),
});
export type HypixelProfileResponse = z.infer<typeof hypixelProfileSchema>;

const bazaarProductSchema = z.object({
  product_id: z.string(),
  sell_summary: z.array(z.object({ pricePerUnit: z.number(), amount: z.number(), orders: z.number().optional() })).optional(),
  buy_summary: z.array(z.object({ pricePerUnit: z.number(), amount: z.number(), orders: z.number().optional() })).optional(),
  quick_status: z
    .object({
      productId: z.string().optional(),
      sellPrice: z.number().optional(),
      sellVolume: z.number().optional(),
      sellMovingWeek: z.number().optional(),
      sellOrders: z.number().optional(),
      buyPrice: z.number().optional(),
      buyVolume: z.number().optional(),
      buyMovingWeek: z.number().optional(),
      buyOrders: z.number().optional(),
    })
    .optional(),
});
export type BazaarProduct = z.infer<typeof bazaarProductSchema>;

export const hypixelBazaarSchema = z.object({
  success: z.boolean(),
  lastUpdated: z.number().optional(),
  products: z.record(z.string(), bazaarProductSchema).optional(),
});
export type HypixelBazaarResponse = z.infer<typeof hypixelBazaarSchema>;

export const hypixelAuctionSchema = z.object({
  uuid: z.string(),
  auctioneer: z.string().optional(),
  profile_id: z.string().optional(),
  item_name: z.string().optional(),
  item_lore: z.string().optional(),
  tier: z.string().optional(),
  category: z.string().optional(),
  starting_bid: z.number().optional(),
  highest_bid_amount: z.number().optional(),
  bin: z.boolean().optional(),
  end: z.number().optional(),
  item_bytes: z.string().optional(),
});
export type HypixelAuction = z.infer<typeof hypixelAuctionSchema>;

export const hypixelAuctionsPageSchema = z.object({
  success: z.boolean(),
  page: z.number().optional(),
  totalPages: z.number().optional(),
  totalAuctions: z.number().optional(),
  lastUpdated: z.number().optional(),
  auctions: z.array(hypixelAuctionSchema).optional(),
});
export type HypixelAuctionsPageResponse = z.infer<typeof hypixelAuctionsPageSchema>;

export const hypixelPlayerAuctionsSchema = z.object({
  success: z.boolean(),
  auctions: z.array(hypixelAuctionSchema).optional(),
});
export type HypixelPlayerAuctionsResponse = z.infer<typeof hypixelPlayerAuctionsSchema>;

export const hypixelResourceSchema = z.object({
  success: z.boolean(),
  lastUpdated: z.number().optional(),
  version: z.string().optional(),
  collections: z.record(z.string(), z.unknown()).optional(),
  skills: z.record(z.string(), z.unknown()).optional(),
});
export type HypixelResourceResponse = z.infer<typeof hypixelResourceSchema>;

const skyblockItemDefSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  tier: z.string().optional(),
  category: z.string().optional(),
  npc_sell_price: z.number().optional(),
  stats: z.record(z.string(), z.number()).optional(),
});
export type SkyblockItemDefinition = z.infer<typeof skyblockItemDefSchema>;

export const hypixelItemsResourceSchema = z.object({
  success: z.boolean(),
  lastUpdated: z.number().optional(),
  items: z.array(skyblockItemDefSchema).optional(),
});
export type HypixelItemsResourceResponse = z.infer<typeof hypixelItemsResourceSchema>;

export const mojangProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type MojangProfile = z.infer<typeof mojangProfileSchema>;
