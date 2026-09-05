import { closeDatabase } from "../src/database/client";
import { syncKnowledgeBase } from "../src/skyblock/knowledge/ingestion/embeddingIndexer";
import { logger } from "../src/utils/logger";

async function main(): Promise<void> {
  logger.info("Starting SkyBlock knowledge base sync...");
  const results = await syncKnowledgeBase();

  const created = results.filter((r) => r.status === "created");
  const updated = results.filter((r) => r.status === "updated");
  const unchanged = results.filter((r) => r.status === "unchanged");
  const failed = results.filter((r) => r.status === "failed");

  logger.info(
    { created: created.length, updated: updated.length, unchanged: unchanged.length, failed: failed.length },
    "Knowledge sync complete",
  );

  for (const result of [...created, ...updated]) {
    logger.info({ url: result.url, chunks: result.chunkCount }, `${result.status === "created" ? "Created" : "Updated"} document`);
  }
  for (const result of failed) {
    logger.error({ url: result.url, error: result.error }, "Failed to sync document");
  }

  await closeDatabase();
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((err) => {
  logger.error({ err }, "Knowledge sync crashed");
  process.exit(1);
});
