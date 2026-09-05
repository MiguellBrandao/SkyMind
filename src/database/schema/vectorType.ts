import { customType } from "drizzle-orm/pg-core";

/**
 * Read directly from process.env (not the validated `env` module) so that schema
 * files can be loaded by drizzle-kit without requiring the full application
 * configuration (Discord token, Hypixel key, etc.) to be present.
 */
export const EMBEDDING_DIMENSIONS = Number(process.env.EMBEDDING_DIMENSIONS) || 768;

/** pgvector column type. Fixed-dimension per deployment; changing it requires a migration + re-embedding. */
export const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return `vector(${EMBEDDING_DIMENSIONS})`;
  },
  toDriver(value) {
    return `[${value.join(",")}]`;
  },
  fromDriver(value) {
    return value
      .replace(/^\[|\]$/, "")
      .replace(/\]$/, "")
      .split(",")
      .filter((v) => v.length > 0)
      .map(Number);
  },
});
