import { getLinkedAccountTool } from "./accountTools";
import { analyzeProfileTool, compareProfilesTool } from "./analysisTools";
import { calculateDamageTool, calculateEffectiveHealthTool, calculateMagicPowerTool, compareItemsTool } from "./calculationTools";
import { getAccessoriesTool, getEnderChestTool, getEquipmentTool, getInventoryTool } from "./inventoryTools";
import { searchSkyblockKnowledgeTool } from "./knowledgeTools";
import { getAuctionPricesTool, getBazaarPriceTool } from "./marketTools";
import { getPlayerTool, getProfilesTool, getSelectedProfileTool, getSkyblockProfileTool } from "./playerTools";
import { getCollectionsTool, getDungeonsTool, getPetsTool, getSkillsTool } from "./progressionTools";
import type { AnyTool } from "./types";

export const ALL_TOOLS: AnyTool[] = [
  getLinkedAccountTool,
  getPlayerTool,
  getProfilesTool,
  getSelectedProfileTool,
  getSkyblockProfileTool,
  getInventoryTool,
  getEnderChestTool,
  getAccessoriesTool,
  getEquipmentTool,
  getPetsTool,
  getSkillsTool,
  getDungeonsTool,
  getCollectionsTool,
  getBazaarPriceTool,
  getAuctionPricesTool,
  searchSkyblockKnowledgeTool,
  compareItemsTool,
  calculateDamageTool,
  calculateEffectiveHealthTool,
  calculateMagicPowerTool,
  analyzeProfileTool,
  compareProfilesTool,
];

export const TOOLS_BY_NAME = new Map(ALL_TOOLS.map((tool) => [tool.name, tool]));

interface KeywordRule {
  pattern: RegExp;
  tools: string[];
}

// Keyword -> tool relevance heuristic. Keeps the model's tool list small and focused per turn
// instead of always exposing all ~20 tools, which improves tool-selection accuracy and cost.
const KEYWORD_RULES: KeywordRule[] = [
  { pattern: /\b(inventory|hotbar|held item)\b/i, tools: ["get_inventory"] },
  { pattern: /\bender ?chest\b/i, tools: ["get_ender_chest"] },
  { pattern: /\b(accessor(y|ies)|talisman|magical power|artifact|ring)\b/i, tools: ["get_accessories", "calculate_magic_power"] },
  { pattern: /\b(equipment|cloak|belt|gloves|necklace|bracelet|armor|armour)\b/i, tools: ["get_equipment"] },
  { pattern: /\bpets?\b/i, tools: ["get_pets"] },
  { pattern: /\bskills?\b/i, tools: ["get_skills"] },
  { pattern: /\b(dungeons?|catacombs|class(es)?|healer|mage|berserk|archer|tank)\b/i, tools: ["get_dungeons"] },
  { pattern: /\bcollections?\b/i, tools: ["get_collections"] },
  { pattern: /\b(bazaar|buy price|sell price)\b/i, tools: ["get_bazaar_price"] },
  { pattern: /\b(auction|bin|ah price|lowest bin)\b/i, tools: ["get_auction_prices"] },
  { pattern: /\b(worth|net ?worth|coins?|money|budget|afford)\b/i, tools: ["analyze_profile", "get_bazaar_price", "get_auction_prices"] },
  { pattern: /\b(compare|versus|vs\.?|better than)\b/i, tools: ["compare_items", "compare_profiles"] },
  { pattern: /\b(damage|dps|hit)\b/i, tools: ["calculate_damage", "get_equipment", "get_skills"] },
  { pattern: /\b(ehp|effective health|survivability|tankiness)\b/i, tools: ["calculate_effective_health"] },
  { pattern: /\b(analy[sz]e|progress|bottleneck|upgrade|score|rating)\b/i, tools: ["analyze_profile"] },
  { pattern: /\b(profile|island|game ?mode|ironman|stranded|bingo)\b/i, tools: ["get_profiles", "get_selected_profile", "get_skyblock_profile"] },
  { pattern: /\bslayer/i, tools: ["get_selected_profile"] },
];

// Always-useful defaults for a generic "how am I doing" style question with no strong keyword match.
const DEFAULT_CORE_TOOLS = ["get_selected_profile", "get_skills", "get_dungeons"];

/**
 * Selects a relevant subset of tools for the current user message, so the model isn't handed
 * all ~20 tools on every turn. Tools marked `alwaysInclude` (account lookup, knowledge search)
 * are always present; everything else is chosen via keyword matching against the message,
 * falling back to a small default core set for generic profile questions.
 */
export function selectRelevantTools(userMessage: string, hasLinkedAccount: boolean): AnyTool[] {
  const always = ALL_TOOLS.filter((tool) => tool.alwaysInclude);
  const matched = new Set<string>();

  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(userMessage)) {
      for (const toolName of rule.tools) matched.add(toolName);
    }
  }

  if (matched.size === 0) {
    for (const toolName of DEFAULT_CORE_TOOLS) matched.add(toolName);
  }

  // If the user isn't linked and didn't name another player, generic profile tools are useless
  // without an `ign` - still include them so the model can ask for one, but always keep get_player.
  if (!hasLinkedAccount) matched.add("get_player");

  const selected = new Map<string, AnyTool>();
  for (const tool of always) selected.set(tool.name, tool);
  for (const name of matched) {
    const tool = TOOLS_BY_NAME.get(name);
    if (tool) selected.set(name, tool);
  }

  return [...selected.values()];
}
