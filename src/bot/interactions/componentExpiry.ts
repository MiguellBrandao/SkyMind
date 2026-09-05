import type {
  ButtonInteraction,
  ChatInputCommandInteraction,
  InteractionEditReplyOptions,
  InteractionReplyOptions,
  Message,
  MessageEditOptions,
  StringSelectMenuInteraction,
} from "discord.js";
import { logger } from "../../utils/logger";

const COMPONENT_EXPIRY_MS = 2 * 60 * 1000; // 2 minutes of inactivity

const timers = new Map<string, NodeJS.Timeout>();

/** Schedules (or reschedules, on repeat interaction) automatic removal of a message's buttons/selects. */
export function scheduleComponentExpiry(message: Message): void {
  const existing = timers.get(message.id);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(() => {
    timers.delete(message.id);
    message.edit({ components: [] } as MessageEditOptions).catch((err: unknown) => {
      logger.debug({ err, messageId: message.id }, "Failed to strip expired components (message likely deleted)");
    });
  }, COMPONENT_EXPIRY_MS);
  timer.unref?.();
  timers.set(message.id, timer);
}

export function cancelComponentExpiry(messageId: string): void {
  const existing = timers.get(messageId);
  if (existing) {
    clearTimeout(existing);
    timers.delete(messageId);
  }
}

type RepliableInteraction = ChatInputCommandInteraction | ButtonInteraction | StringSelectMenuInteraction;

function hasComponents(options: { components?: readonly unknown[] }): boolean {
  return Boolean(options.components && options.components.length > 0);
}

/** `interaction.editReply()` that also (re)schedules or clears this message's auto-expiry based on whether it has components. */
export async function editReplyWithExpiry(interaction: RepliableInteraction, options: InteractionEditReplyOptions): Promise<Message> {
  const message = await interaction.editReply(options);
  if (hasComponents(options)) scheduleComponentExpiry(message);
  else cancelComponentExpiry(message.id);
  return message;
}

/** `interaction.reply()` that also schedules this message's auto-expiry when it has components. */
export async function replyWithExpiry(interaction: RepliableInteraction, options: InteractionReplyOptions): Promise<void> {
  await interaction.reply(options);
  if (hasComponents(options)) {
    const message = await interaction.fetchReply();
    scheduleComponentExpiry(message);
  }
}
