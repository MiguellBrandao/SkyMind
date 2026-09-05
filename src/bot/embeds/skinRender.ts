/** Square face+hat avatar render via mc-heads.net (public, no-auth, reliable Minecraft skin rendering service). */
export function getSkinAvatarUrl(uuid: string): string {
  return `https://mc-heads.net/avatar/${uuid}/128`;
}
