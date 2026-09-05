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
