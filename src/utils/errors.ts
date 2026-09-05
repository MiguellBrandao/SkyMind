export class AppError extends Error {
  public readonly userMessage: string;
  public code: string;

  constructor(message: string, options: { userMessage?: string; code?: string; cause?: unknown } = {}) {
    super(message, { cause: options.cause });
    this.name = this.constructor.name;
    this.userMessage = options.userMessage ?? "Something went wrong. Please try again in a moment.";
    this.code = options.code ?? "INTERNAL_ERROR";
  }
}

export class HypixelApiError extends AppError {
  constructor(message: string, public readonly status?: number, options: { userMessage?: string; cause?: unknown } = {}) {
    super(message, {
      code: "HYPIXEL_API_ERROR",
      userMessage: options.userMessage ?? "Hypixel's API is having issues right now. Please try again shortly.",
      cause: options.cause,
    });
  }
}

export class HypixelRateLimitError extends HypixelApiError {
  constructor(public readonly retryAfterMs: number) {
    super(`Hypixel API rate limit exceeded, retry after ${retryAfterMs}ms`, 429, {
      userMessage: "SkyMind is being rate limited by Hypixel right now. Please try again in a few seconds.",
    });
    this.code = "HYPIXEL_RATE_LIMIT";
  }
}

export class PlayerNotFoundError extends AppError {
  constructor(ign: string) {
    super(`Player not found: ${ign}`, {
      code: "PLAYER_NOT_FOUND",
      userMessage: `Could not find a Minecraft account named **${ign}**. Double check the spelling.`,
    });
  }
}

export class NoSkyBlockProfileError extends AppError {
  constructor(ign: string) {
    super(`No SkyBlock profiles for: ${ign}`, {
      code: "NO_SKYBLOCK_PROFILE",
      userMessage: `**${ign}** doesn't have any SkyBlock profiles yet.`,
    });
  }
}

export class PrivateApiError extends AppError {
  constructor(ign: string) {
    super(`API data is private for: ${ign}`, {
      code: "PRIVATE_API",
      userMessage: `**${ign}**'s API settings are private. Ask them to enable API access at Hypixel Skyblock Menu -> Settings -> Socials & API, or all of it via /api settings on the Hypixel server.`,
    });
  }
}

export class AccountNotLinkedError extends AppError {
  constructor() {
    super("Discord account is not linked to a Minecraft account", {
      code: "NOT_LINKED",
      userMessage: "You haven't linked a Minecraft account yet. Use `/link` first.",
    });
  }
}

export class VerificationError extends AppError {
  constructor(message: string, userMessage: string) {
    super(message, { code: "VERIFICATION_FAILED", userMessage });
  }
}

export class AiProviderError extends AppError {
  constructor(message: string, options: { userMessage?: string; cause?: unknown } = {}) {
    super(message, {
      code: "AI_PROVIDER_ERROR",
      userMessage: options.userMessage ?? "The AI provider is unavailable right now. Please try again shortly.",
      cause: options.cause,
    });
  }
}

export class KnowledgeBaseError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, {
      code: "KNOWLEDGE_BASE_ERROR",
      userMessage: "The SkyBlock knowledge base is temporarily unavailable.",
      cause,
    });
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, { code: "VALIDATION_ERROR", userMessage: message });
  }
}

export function toUserMessage(err: unknown): string {
  if (err instanceof AppError) return err.userMessage;
  return "Something unexpected went wrong. Please try again.";
}
