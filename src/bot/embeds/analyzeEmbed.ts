import { EmbedBuilder } from "discord.js";
import type { ProfileAnalysis } from "../../skyblock/services/profileAnalyzer";
import { COLORS } from "./colors";

function scoreBar(score: number): string {
  const filled = Math.round(score / 10);
  return "█".repeat(filled) + "░".repeat(10 - filled);
}

const SEVERITY_EMOJI: Record<string, string> = { high: "🔴", medium: "🟡", low: "🔵" };

export function buildAnalyzeEmbed(username: string, analysis: ProfileAnalysis): EmbedBuilder {
  const scoreLines = Object.entries(analysis.scores)
    .filter(([key]) => key !== "overall")
    .map(([key, value]) => `**${capitalize(key)}**\n${scoreBar(value)} ${value}/100`)
    .join("\n\n");

  const bottleneckLines =
    analysis.bottlenecks.length > 0
      ? analysis.bottlenecks.map((b) => `${SEVERITY_EMOJI[b.severity]} **${b.title}**\n${b.detail}`).join("\n\n")
      : "No major bottlenecks detected - solid, well-rounded profile.";

  const upgradeLines = analysis.upgrades.length > 0 ? analysis.upgrades.map((u) => `⬆️ **${u.title}**\n${u.detail}`).join("\n\n") : "No specific upgrade suggestions right now.";

  return new EmbedBuilder()
    .setColor(COLORS.primary)
    .setTitle(`🔎 ${username}'s Profile Analysis`)
    .setDescription(`**Overall Progression Score: ${analysis.scores.overall}/100**\n${scoreBar(analysis.scores.overall)}\n\n_SkyMind's own heuristic scoring, not an official Hypixel statistic._`)
    .addFields(
      { name: "Category Scores", value: scoreLines },
      { name: "Top Bottlenecks", value: bottleneckLines },
      { name: "Suggested Upgrade Directions", value: upgradeLines },
      {
        name: "Economy",
        value: `Estimated net worth: **${Math.round(analysis.estimatedNetWorth).toLocaleString("en-US")} coins** (confidence: ${analysis.netWorthConfidence})`,
      },
    )
    .setFooter({ text: "Ask the AI (/ask) for specific, cost-aware item recommendations." });
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
