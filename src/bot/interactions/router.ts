import type { Interaction } from "discord.js";
import { logger } from "../../utils/logger";
import { handleLinkConfirm } from "./buttons/linkButtonHandler";
import { handleNetworthAction } from "./buttons/networthActionHandler";
import { handleProfileAction } from "./buttons/profileActionHandler";
import { handleUnlinkConfirm } from "./buttons/unlinkButtonHandler";
import { handleProfileAskModal } from "./modals/profileAskModalHandler";
import { handleSettingsAiModal } from "./modals/settingsAiModalHandler";
import { handleNetworthSelect } from "./selects/networthSelectHandler";
import { handleProfileSelect } from "./selects/profileSelectHandler";
import { handleSettingsAiSelect } from "./selects/settingsAiSelectHandler";

export async function routeInteraction(interaction: Interaction): Promise<void> {
  try {
    if (interaction.isButton()) {
      const namespace = interaction.customId.split(":")[0];
      if (namespace === "profile") return await handleProfileAction(interaction);
      if (namespace === "networth") return await handleNetworthAction(interaction);
      if (namespace === "link") return await handleLinkConfirm(interaction);
      if (namespace === "unlink") return await handleUnlinkConfirm(interaction);
      return;
    }

    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === "settings:ai-provider") return await handleSettingsAiSelect(interaction);
      if (interaction.customId.startsWith("profile:select-profile:")) return await handleProfileSelect(interaction);
      if (interaction.customId.startsWith("networth:select-profile:")) return await handleNetworthSelect(interaction);
      return;
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith("profile:ask-modal:")) return await handleProfileAskModal(interaction);
      if (interaction.customId.startsWith("settings:ai-modal:")) return await handleSettingsAiModal(interaction);
      return;
    }
  } catch (err) {
    logger.error({ err, customId: "customId" in interaction ? interaction.customId : undefined }, "Unhandled interaction routing error");
  }
}
