import { aiConfig } from "../config";
import { checkDatabaseHealth } from "../database/client";
import { rateLimiter } from "../hypixel/client/httpClient";
import { knowledgeRepository } from "../database/repositories/knowledgeRepository";
import { checkRedisHealth } from "./redisClient";

export async function getHealthReport() {
  const [database, redis, knowledgeDocumentCount, knowledgeChunkCount] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
    knowledgeRepository.countDocuments().catch(() => -1),
    knowledgeRepository.countChunks().catch(() => -1),
  ]);

  return {
    database,
    redis,
    hypixel: rateLimiter.stats,
    knowledge: { documents: knowledgeDocumentCount, chunks: knowledgeChunkCount },
    ai: {
      defaultProvider: aiConfig.defaultProvider,
      defaultModel: aiConfig.defaultModel,
      defaultKeyConfigured: aiConfig.defaultApiKey.length > 0,
      embeddingProvider: aiConfig.embeddingProvider,
    },
  };
}
