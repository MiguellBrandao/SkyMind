import { z } from "zod";
import { resolveIgnToUuid } from "../../hypixel/client/mojangClient";
import { compareProfiles } from "../../skyblock/services/compareService";
import { analyzeProfile } from "../../skyblock/services/profileAnalyzer";
import { profileService } from "../../skyblock/services/profileService";
import { resolveTarget } from "./resolveTarget";
import { defineTool } from "./types";

const ignParam = z.string().min(1).max(16).optional().describe("Minecraft username to look up. Omit to use the calling user's own linked account.");

export const analyzeProfileTool = defineTool({
  name: "analyze_profile",
  description:
    "Runs SkyMind's full profile analyzer on a player's SkyBlock profile: category progression scores (Combat, Dungeons, Accessories, Pets, Equipment, Economy, Progression), net worth, and ranked bottlenecks/upgrade directions. Use this for any 'how am I doing' / 'what should I improve' style question.",
  schema: z.object({ ign: ignParam, profileName: z.string().optional() }),
  handler: async (args, ctx) => {
    const target = await resolveTarget(args, ctx);
    let profileId: string | undefined = target.profileId;
    if (args.profileName) {
      const profiles = await profileService.getProfileList(target.uuid);
      profileId = profiles.find((p) => p.cute_name?.toLowerCase() === args.profileName?.toLowerCase())?.profile_id ?? target.profileId;
    }
    const detail = await profileService.getDetail(target.uuid, profileId);
    const analysis = await analyzeProfile(detail);
    return {
      player: target.username,
      profileName: detail.cuteName,
      ...analysis,
      dataQualityNote: "Scores are SkyMind's own heuristic 0-100 scale, not an official Hypixel statistic. Net worth uses live bazaar/auction pricing data.",
    };
  },
});

export const compareProfilesTool = defineTool({
  name: "compare_profiles",
  description: "Compares two players' SkyBlock profiles side by side across every progression category. Use when the user asks to compare themselves to a friend, or compare two named players.",
  schema: z.object({
    ignA: z.string().min(1).max(16).describe("First player's IGN. If omitted elsewhere, this should be the primary subject."),
    ignB: z.string().min(1).max(16).describe("Second player's IGN to compare against."),
  }),
  handler: async (args) => {
    const [targetA, targetB] = await Promise.all([resolveIgnToUuid(args.ignA), resolveIgnToUuid(args.ignB)]);
    const [detailA, detailB] = await Promise.all([profileService.getDetail(targetA.uuid), profileService.getDetail(targetB.uuid)]);
    return compareProfiles({ label: targetA.username, profile: detailA }, { label: targetB.username, profile: detailB });
  },
});
