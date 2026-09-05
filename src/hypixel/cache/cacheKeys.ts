export const cacheKeys = {
  player: (uuid: string) => `hypixel:player:${uuid}`,
  profiles: (uuid: string) => `hypixel:profiles:${uuid}`,
  profile: (profileId: string) => `hypixel:profile:${profileId}`,
  bazaar: () => "hypixel:bazaar",
  auctionsPage: (page: number) => `hypixel:auctions:page:${page}`,
  auctionsIndex: () => "hypixel:auctions:index",
  auctionsByPlayer: (uuid: string) => `hypixel:auctions:player:${uuid}`,
  news: () => "hypixel:news",
  resource: (name: string) => `hypixel:resources:${name}`,
  itemsResource: () => "hypixel:resources:items",
  mojangUuid: (ign: string) => `mojang:uuid:${ign.toLowerCase()}`,
} as const;
