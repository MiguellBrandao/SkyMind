import { EmbedBuilder } from "discord.js";
import type { SkyblockProfileSnapshot } from "../../skyblock/services/profileService";
import { COLORS } from "./colors";
import { DUNGEON_CLASS_ICON, SKILL_ICON, SLAYER_ICON, SLAYER_ORDER } from "./icons";
import { getSkinAvatarUrl } from "./skinRender";

function formatSkillLine(key: string, label: string, level: number | undefined, progress: number | undefined): string {
  const pct = progress !== undefined ? Math.round(progress * 100) : 0;
  return `${SKILL_ICON[key] ?? "▫️"} **${label}**: ${level ?? 0} (${pct}% to next)`;
}

export function buildStatsEmbed(username: string, snapshot: SkyblockProfileSnapshot, uuid: string): EmbedBuilder {
  const s = snapshot.skills.skills;

  const skillLines = [
    formatSkillLine("farming", "Farming", s.farming?.level, s.farming?.progressToNext),
    formatSkillLine("mining", "Mining", s.mining?.level, s.mining?.progressToNext),
    formatSkillLine("combat", "Combat", s.combat?.level, s.combat?.progressToNext),
    formatSkillLine("foraging", "Foraging", s.foraging?.level, s.foraging?.progressToNext),
    formatSkillLine("fishing", "Fishing", s.fishing?.level, s.fishing?.progressToNext),
    formatSkillLine("enchanting", "Enchanting", s.enchanting?.level, s.enchanting?.progressToNext),
    formatSkillLine("alchemy", "Alchemy", s.alchemy?.level, s.alchemy?.progressToNext),
    formatSkillLine("taming", "Taming", s.taming?.level, s.taming?.progressToNext),
  ].join("\n");

  const classLines = Object.entries(snapshot.dungeons.classes)
    .map(([cls, level]) => `${DUNGEON_CLASS_ICON[cls] ?? "▫️"} **${cls}**: ${level.level}`)
    .join("  ");

  const slayerByBoss = new Map(snapshot.slayers.map((s2) => [s2.boss, s2.level]));
  const slayerLines = SLAYER_ORDER.map((boss) => `${SLAYER_ICON[boss]} **${boss}**: ${slayerByBoss.get(boss) ?? 0}`).join("  ");

  return new EmbedBuilder()
    .setColor(COLORS.info)
    .setAuthor({ name: `${username}'s Detailed Stats`, iconURL: getSkinAvatarUrl(uuid) })
    .setThumbnail(getSkinAvatarUrl(uuid))
    .addFields(
      { name: "📚 Skills", value: skillLines },
      { name: `📈 Skill Average: ${snapshot.skills.skillAverage}`, value: "​" },
      {
        name: `🏰 Catacombs: ${snapshot.dungeons.catacombs.level}${snapshot.dungeons.masterCatacombs ? ` (Master ${snapshot.dungeons.masterCatacombs.level})` : ""}`,
        value: classLines || "No class data",
      },
      { name: "🗡️ Slayers", value: slayerLines },
    )
    .setTimestamp(snapshot.fetchedAt);
}
