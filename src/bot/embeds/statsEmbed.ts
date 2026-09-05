import { EmbedBuilder } from "discord.js";
import type { SkyblockProfileSnapshot } from "../../skyblock/services/profileService";
import { COLORS } from "./colors";

function formatSkillLine(name: string, level: number | undefined, progress: number | undefined): string {
  const pct = progress !== undefined ? Math.round(progress * 100) : 0;
  return `**${name}**: ${level ?? 0} (${pct}% to next)`;
}

export function buildStatsEmbed(username: string, snapshot: SkyblockProfileSnapshot): EmbedBuilder {
  const s = snapshot.skills.skills;

  const skillLines = [
    formatSkillLine("Farming", s.farming?.level, s.farming?.progressToNext),
    formatSkillLine("Mining", s.mining?.level, s.mining?.progressToNext),
    formatSkillLine("Combat", s.combat?.level, s.combat?.progressToNext),
    formatSkillLine("Foraging", s.foraging?.level, s.foraging?.progressToNext),
    formatSkillLine("Fishing", s.fishing?.level, s.fishing?.progressToNext),
    formatSkillLine("Enchanting", s.enchanting?.level, s.enchanting?.progressToNext),
    formatSkillLine("Alchemy", s.alchemy?.level, s.alchemy?.progressToNext),
    formatSkillLine("Taming", s.taming?.level, s.taming?.progressToNext),
  ].join("\n");

  const classLines = Object.entries(snapshot.dungeons.classes)
    .map(([cls, level]) => `**${cls}**: ${level.level}`)
    .join(" | ");

  const slayerLines =
    snapshot.slayers.length > 0 ? snapshot.slayers.map((s2) => `**${s2.boss}**: ${s2.level}`).join(" | ") : "No slayer progress yet";

  return new EmbedBuilder()
    .setColor(COLORS.info)
    .setTitle(`📈 ${username}'s Detailed Stats`)
    .addFields(
      { name: "Skills", value: skillLines },
      { name: `Skill Average: ${snapshot.skills.skillAverage}`, value: "​" },
      { name: `Catacombs: ${snapshot.dungeons.catacombs.level}${snapshot.dungeons.masterCatacombs ? ` (Master ${snapshot.dungeons.masterCatacombs.level})` : ""}`, value: classLines || "No class data" },
      { name: "Slayers", value: slayerLines },
    )
    .setTimestamp(snapshot.fetchedAt);
}
