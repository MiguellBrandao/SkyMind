/** Square face+hat avatar render via Crafatar (public, no-auth Minecraft skin rendering service). */
export function getSkinAvatarUrl(uuid: string): string {
  return `https://crafatar.com/avatars/${uuid}?size=128&overlay`;
}
