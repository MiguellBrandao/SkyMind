import pino from "pino";
import { env } from "../config/env";

const REDACT_PATHS = [
  "apiKey",
  "*.apiKey",
  "*.api_key",
  "token",
  "*.token",
  "password",
  "req.headers.authorization",
  "*.encryptedKey",
  "*.decryptedKey",
];

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: REDACT_PATHS,
    censor: "[REDACTED]",
  },
  transport:
    env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:standard", ignore: "pid,hostname" },
        }
      : undefined,
  base: { service: "skymind" },
});

export function childLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}
