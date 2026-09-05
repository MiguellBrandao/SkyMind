import { createHash } from "node:crypto";
import { getEmbeddingProvider } from "../../../ai/providers/ProviderFactory";
import { knowledgeRepository } from "../../../database/repositories/knowledgeRepository";
import type { KnowledgeSource } from "../../../database/schema";
import { logger } from "../../../utils/logger";
import { chunkText } from "./chunker";
import { fetchIngestionPage } from "./fetcher";
import { cleanMediaWikiHtml } from "./htmlCleaner";
import { KNOWLEDGE_SOURCES, type KnowledgeSourceConfig } from "./sources";

const EMBEDDING_BATCH_SIZE = 20;

function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

export interface SyncResult {
  url: string;
  status: "unchanged" | "updated" | "created" | "failed";
  chunkCount?: number;
  error?: string;
}

async function syncOne(config: KnowledgeSourceConfig): Promise<SyncResult> {
  try {
    const html = await fetchIngestionPage(config.url);
    const { title, content } = cleanMediaWikiHtml(html);

    if (content.length < 100) {
      return { url: config.url, status: "failed", error: "Extracted content too short - the page structure may not match the expected selectors" };
    }

    const hash = hashContent(content);
    const existing = await knowledgeRepository.findDocumentByUrl(config.url);

    if (existing && existing.contentHash === hash) {
      return { url: config.url, status: "unchanged" };
    }

    const chunks = chunkText(content);
    const embeddingProvider = getEmbeddingProvider();
    if (!embeddingProvider.embed) {
      throw new Error(`Embedding provider '${embeddingProvider.id}' does not support embed()`);
    }

    const embeddings: number[][] = [];
    for (let i = 0; i < chunks.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = chunks.slice(i, i + EMBEDDING_BATCH_SIZE).map((c) => c.content);
      const batchEmbeddings = await embeddingProvider.embed(batch);
      embeddings.push(...batchEmbeddings);
    }

    const document = await knowledgeRepository.upsertDocument({
      source: config.source,
      url: config.url,
      title,
      category: config.category,
      contentHash: hash,
      updatedAt: new Date(),
    });

    await knowledgeRepository.replaceChunks(
      document.id,
      chunks.map((chunk, index) => ({ content: chunk.content, embedding: embeddings[index] ?? [] })),
    );

    return { url: config.url, status: existing ? "updated" : "created", chunkCount: chunks.length };
  } catch (err) {
    logger.error({ err, url: config.url }, "Failed to sync knowledge source");
    return { url: config.url, status: "failed", error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Syncs every configured knowledge source: fetches, cleans, hashes, and only re-chunks/re-embeds
 * documents whose content actually changed. Also prunes documents whose URL was removed from the
 * source list for its `source` type.
 */
export async function syncKnowledgeBase(sources: KnowledgeSourceConfig[] = KNOWLEDGE_SOURCES): Promise<SyncResult[]> {
  const results: SyncResult[] = [];

  // Sequential on purpose: polite to the wiki and keeps embedding-provider rate limits predictable.
  for (const source of sources) {
    logger.info({ url: source.url }, "Syncing knowledge source");
    results.push(await syncOne(source));
  }

  const urlsBySource = new Map<KnowledgeSource, string[]>();
  for (const s of sources) {
    urlsBySource.set(s.source, [...(urlsBySource.get(s.source) ?? []), s.url]);
  }
  for (const [source, urls] of urlsBySource) {
    const pruned = await knowledgeRepository.pruneDocumentsNotIn(urls, source);
    if (pruned > 0) logger.info({ source, pruned }, "Pruned stale knowledge documents no longer in the source list");
  }

  return results;
}
