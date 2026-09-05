import { askCommand } from "./ask";
import { linkCommand } from "./link";
import { networthCommand } from "./networth";
import { profileCommand } from "./profile";
import { settingsCommand } from "./settings";
import { statsCommand } from "./stats";
import type { SlashCommand } from "./types";
import { unlinkCommand } from "./unlink";

export const commands: SlashCommand[] = [linkCommand, unlinkCommand, profileCommand, statsCommand, networthCommand, askCommand, settingsCommand];

export const commandsByName = new Map(commands.map((command) => [command.data.name, command]));
