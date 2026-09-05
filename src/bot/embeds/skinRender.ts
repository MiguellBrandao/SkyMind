/**
 * Square face+hat avatar render via minotar.net. Verified directly (compared the etag/texture hash
 * it returns against the player's actual skin_texture hash from Mojang's session server) - unlike
 * mc-heads.net (currently serving the same generic fallback image for every UUID, valid or not) and
 * crafatar.com (currently 500ing), this one is actually resolving real skins right now.
 */
export function getSkinAvatarUrl(uuid: string): string {
  return `https://minotar.net/avatar/${uuid}/128`;
}
