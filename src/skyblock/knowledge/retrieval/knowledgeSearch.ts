import { getEmbeddingProvider } from "../../../ai/providers/ProviderFactory";
import { knowledgeRepository, type KnowledgeSearchResult } from "../../../database/repositories/knowledgeRepository";
import { KnowledgeBaseError } from "../../../utils/errors";

export async function searchKnowledge(query: string, topK = 5): Promise<KnowledgeSearchResult[]> {
  const provider = getEmbeddingProvider();
  if (!provider.embed) {
    throw new KnowledgeBaseError(`Embedding provider '${provider.id}' does not support embed()`);
  }

  const [embedding] = await provider.embed([query]);
  if (!embedding) {
    throw new KnowledgeBaseError("Failed to generate query embedding");
  }

  return knowledgeRepository.search(embedding, topK);
}
