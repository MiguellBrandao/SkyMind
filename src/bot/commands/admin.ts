import { PermissionFlagsBits, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { adminUserIds } from "../../config";
import { linkedAccountRepository } from "../../database/repositories/linkedAccountRepository";
import { knowledgeRepository } from "../../database/repositories/knowledgeRepository";
import { SYSTEM_SETTING_KEYS, systemSettingsRepository } from "../../database/repositories/systemSettingsRepository";
import { syncKnowledgeBase } from "../../skyblock/knowledge/ingestion/embeddingIndexer";
import { getHealthReport } from "../../services/healthService";
import { redis } from "../../services/redisClient";
import { toUserMessage } from "../../utils/errors";
import { buildErrorEmbed, buildInfoEmbed } from "../embeds/errorEmbed";
import type { SlashCommand } from "./types";

function isAuthorized(interaction: ChatInputCommandInteraction): boolean {
  if (adminUserIds.has(interaction.user.id)) return true;
  return interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ?? false;
}

export const adminCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("admin")
    .setDescription("SkyMind administrator tools")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) => sub.setName("cache").setDescription("Inspect cache and Hypixel rate-limit stats"))
    .addSubcommand((sub) =>
      sub
        .setName("knowledge")
        .setDescription("Inspect or trigger the SkyBlock knowledge base sync")
        .addStringOption((opt) => opt.setName("action").setDescription("status or sync").addChoices({ name: "status", value: "status" }, { name: "sync", value: "sync" })),
    )
    .addSubcommand((sub) => sub.setName("stats").setDescription("Show bot-wide usage stats"))
    .addSubcommand((sub) => sub.setName("ai").setDescription("Show AI provider configuration/health"))
    .addSubcommand((sub) =>
      sub
        .setName("maintenance")
        .setDescription("View or toggle maintenance settings")
        .addBooleanOption((opt) => opt.setName("bot_maintenance").setDescription("Enable/disable AI maintenance mode"))
        .addBooleanOption((opt) => opt.setName("allow_multi_link").setDescription("Allow one Minecraft account to link to multiple Discord accounts")),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!isAuthorized(interaction)) {
      await interaction.reply({ embeds: [buildErrorEmbed("You're not authorized to use admin commands.")], ephemeral: true });
      return;
    }

    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: true });

    try {
      if (sub === "cache") {
        const health = await getHealthReport();
        await interaction.editReply({
          embeds: [
            buildInfoEmbed(
              "🗄️ Cache & Rate Limit Status",
              [
                `Redis: ${health.redis ? "✅ connected" : "❌ unreachable"}`,
                `Hypixel rate limiter: ${health.hypixel.activeCount} active, ${health.hypixel.tokensRemaining} tokens left this minute, ${health.hypixel.queueLength} queued, cooldown ${health.hypixel.cooldownRemainingMs}ms`,
              ].join("\n"),
            ),
          ],
        });
        return;
      }

      if (sub === "knowledge") {
        const action = interaction.options.getString("action") ?? "status";
        if (action === "sync") {
          const results = await syncKnowledgeBase();
          const created = results.filter((r) => r.status === "created").length;
          const updated = results.filter((r) => r.status === "updated").length;
          const unchanged = results.filter((r) => r.status === "unchanged").length;
          const failed = results.filter((r) => r.status === "failed");
          await interaction.editReply({
            embeds: [
              buildInfoEmbed(
                "📚 Knowledge Sync Complete",
                [
                  `Created: ${created} | Updated: ${updated} | Unchanged: ${unchanged} | Failed: ${failed.length}`,
                  ...failed.map((f) => `❌ ${f.url}: ${f.error}`),
                ].join("\n"),
              ),
            ],
          });
          return;
        }

        const [docCount, chunkCount] = await Promise.all([knowledgeRepository.countDocuments(), knowledgeRepository.countChunks()]);
        await interaction.editReply({
          embeds: [buildInfoEmbed("📚 Knowledge Base Status", `${docCount} documents indexed, ${chunkCount} chunks total.\nRun \`/admin knowledge action:sync\` to refresh.`)],
        });
        return;
      }

      if (sub === "stats") {
        const [linkedCount, health] = await Promise.all([linkedAccountRepository.countAll(), getHealthReport()]);
        const dbSize = await redis.dbsize().catch(() => -1);
        await interaction.editReply({
          embeds: [
            buildInfoEmbed(
              "📊 Bot Stats",
              [
                `Guilds: ${interaction.client.guilds.cache.size}`,
                `Linked accounts: ${linkedCount}`,
                `Redis keys: ${dbSize}`,
                `Database: ${health.database ? "✅" : "❌"} | Redis: ${health.redis ? "✅" : "❌"}`,
                `Uptime: ${Math.floor((interaction.client.uptime ?? 0) / 60000)} minutes`,
              ].join("\n"),
            ),
          ],
        });
        return;
      }

      if (sub === "ai") {
        const health = await getHealthReport();
        await interaction.editReply({
          embeds: [
            buildInfoEmbed(
              "🧠 AI Provider Configuration",
              [
                `Default provider: **${health.ai.defaultProvider}** (${health.ai.defaultModel})`,
                `Default key configured: ${health.ai.defaultKeyConfigured ? "✅" : "❌ MISSING"}`,
                `Embedding provider: ${health.ai.embeddingProvider}`,
              ].join("\n"),
            ),
          ],
        });
        return;
      }

      if (sub === "maintenance") {
        const botMaintenance = interaction.options.getBoolean("bot_maintenance");
        const allowMultiLink = interaction.options.getBoolean("allow_multi_link");

        if (botMaintenance !== null) await systemSettingsRepository.set(SYSTEM_SETTING_KEYS.botMaintenance, botMaintenance);
        if (allowMultiLink !== null) await systemSettingsRepository.set(SYSTEM_SETTING_KEYS.allowMultiLink, allowMultiLink);

        const [currentMaintenance, currentMultiLink] = await Promise.all([
          systemSettingsRepository.get<boolean>(SYSTEM_SETTING_KEYS.botMaintenance, false),
          systemSettingsRepository.get<boolean>(SYSTEM_SETTING_KEYS.allowMultiLink, false),
        ]);

        await interaction.editReply({
          embeds: [buildInfoEmbed("🛠️ Maintenance Settings", [`Bot maintenance mode: ${currentMaintenance ? "🔴 ON" : "🟢 OFF"}`, `Allow multi-link: ${currentMultiLink ? "🟢 ON" : "🔴 OFF"}`].join("\n"))],
        });
      }
    } catch (err) {
      await interaction.editReply({ embeds: [buildErrorEmbed(toUserMessage(err))] });
    }
  },
};
