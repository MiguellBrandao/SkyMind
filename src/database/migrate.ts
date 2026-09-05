import path from "node:path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool, closeDatabase } from "./client";
import { logger } from "../utils/logger";

async function ensureExtensions(): Promise<void> {
  await pool.query("CREATE EXTENSION IF NOT EXISTS vector;");
  await pool.query("CREATE EXTENSION IF NOT EXISTS pgcrypto;");
}

async function main(): Promise<void> {
  logger.info("Ensuring required PostgreSQL extensions (vector, pgcrypto)...");
  await ensureExtensions();

  logger.info("Running database migrations...");
  // Resolved from the working directory (project root when run via `npm run db:migrate` or in
  // the Docker image) rather than __dirname, since __dirname differs between tsx (runs from
  // src/) and the compiled dist/src/ output.
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });

  logger.info("Migrations complete.");
  await closeDatabase();
}

main().catch((err) => {
  logger.error({ err }, "Migration failed");
  process.exit(1);
});
