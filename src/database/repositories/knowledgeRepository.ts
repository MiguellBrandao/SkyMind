import { and, eq, notInArray } from "drizzle-orm";
import { db, pool } from "../client";
import { knowledgeChunks, knowledgeDocuments, type KnowledgeSource, type NewKnowledgeDocument } from "../schema";

export interface KnowledgeSearchResult {
  documentId: string;
  chunkId: string;
  title: string;
  url: string;
  category: string;
  source: KnowledgeSource;
  updatedAt: Date;
  content: string;
  similarity: number;
}

export const knowledgeRepository = {
  async findDocumentByUrl(url: string) {
    const rows = await db.select().from(knowledgeDocuments).where(eq(knowledgeDocuments.url, url)).limit(1);
    return rows[0];
  },

  async upsertDocument(doc: NewKnowledgeDocument) {
    const rows = await db
      .insert(knowledgeDocuments)
      .values(doc)
      .onConflictDoUpdate({
        target: knowledgeDocuments.url,
        set: {
          title: doc.title,
          category: doc.category,
          contentHash: doc.contentHash,
          source: doc.source,
          updatedAt: doc.updatedAt ?? new Date(),
        },
      })
      .returning();
    const row = rows[0];
    if (!row) throw new Error("Failed to upsert knowledge document");
    return row;
  },

  async replaceChunks(documentId: string, chunks: { content: string; embedding: number[] }[]): Promise<void> {
    await db.delete(knowledgeChunks).where(eq(knowledgeChunks.documentId, documentId));
    if (chunks.length === 0) return;
    await db.insert(knowledgeChunks).values(
      chunks.map((chunk, index) => ({
        documentId,
        chunkIndex: index,
        content: chunk.content,
        embedding: chunk.embedding,
      })),
    );
  },

  async countDocuments(): Promise<number> {
    const rows = await db.select({ id: knowledgeDocuments.id }).from(knowledgeDocuments);
    return rows.length;
  },

  async countChunks(): Promise<number> {
    const rows = await db.select({ id: knowledgeChunks.id }).from(knowledgeChunks);
    return rows.length;
  },

  async listDocumentsSummary() {
    return db
      .select({
        id: knowledgeDocuments.id,
        source: knowledgeDocuments.source,
        title: knowledgeDocuments.title,
        url: knowledgeDocuments.url,
        updatedAt: knowledgeDocuments.updatedAt,
      })
      .from(knowledgeDocuments)
      .orderBy(knowledgeDocuments.updatedAt);
  },

  /**
   * Cosine-similarity nearest-neighbor search over knowledge_chunks via pgvector's `<=>` operator.
   * Raw SQL is used because drizzle's query builder doesn't yet expose pgvector distance operators typed.
   */
  async search(embedding: number[], topK: number): Promise<KnowledgeSearchResult[]> {
    const vectorLiteral = `[${embedding.join(",")}]`;
    const result = await pool.query(
      `
      SELECT
        c.id AS chunk_id,
        c.document_id,
        c.content,
        d.title,
        d.url,
        d.category,
        d.source,
        d.updated_at,
        1 - (c.embedding <=> $1::vector) AS similarity
      FROM knowledge_chunks c
      JOIN knowledge_documents d ON d.id = c.document_id
      WHERE c.embedding IS NOT NULL
      ORDER BY c.embedding <=> $1::vector
      LIMIT $2
      `,
      [vectorLiteral, topK],
    );

    return result.rows.map((row) => ({
      documentId: row.document_id as string,
      chunkId: row.chunk_id as string,
      title: row.title as string,
      url: row.url as string,
      category: row.category as string,
      source: row.source as KnowledgeSource,
      updatedAt: row.updated_at as Date,
      content: row.content as string,
      similarity: Number(row.similarity),
    }));
  },

  async deleteDocument(documentId: string): Promise<void> {
    await db.delete(knowledgeDocuments).where(eq(knowledgeDocuments.id, documentId));
  },

  async pruneDocumentsNotIn(urls: string[], source: KnowledgeSource): Promise<number> {
    if (urls.length === 0) {
      const rows = await db.delete(knowledgeDocuments).where(eq(knowledgeDocuments.source, source)).returning();
      return rows.length;
    }
    const rows = await db
      .delete(knowledgeDocuments)
      .where(and(eq(knowledgeDocuments.source, source), notInArray(knowledgeDocuments.url, urls)))
      .returning();
    return rows.length;
  },
};
