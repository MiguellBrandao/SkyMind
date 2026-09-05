import { PermissionFlagsBits, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { adminUserIds } from "../../config";
import { linkedAccountRepository } from "../../database/repositories/linkedAccountRepository";
import { SYSTEM_SETTING_KEYS, systemSettingsRepository } from "../../database/repositories/systemSettingsRepository";
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
    .addSubcommand((sub) => sub.setName("knowledge").setDescription("Show which live SkyBlock knowledge sources are active"))
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
        const health = await getHealthReport();
        await interaction.editReply({
          embeds: [
            buildInfoEmbed(
              "📚 Knowledge Sources",
              [
                "✅ SkyBlock Wiki (hypixelskyblock.minecraft.wiki) - always active, live search",
                "✅ Hypixel SkyBlock Wiki (Fandom) - always active, live search",
                `${health.knowledge.redditConfigured ? "✅" : "⚪"} Reddit r/HypixelSkyblock - ${health.knowledge.redditConfigured ? "active" : "not configured (set REDDIT_CLIENT_ID/REDDIT_CLIENT_SECRET)"}`,
                "⚪ Hypixel Forums - not available (no public search API; the forum's Cloudflare bot protection blocks anonymous search)",
              ].join("\n"),
            ),
          ],
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
              [`Default provider: **${health.ai.defaultProvider}** (${health.ai.defaultModel})`, `Default key configured: ${health.ai.defaultKeyConfigured ? "✅" : "❌ MISSING"}`].join("\n"),
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
