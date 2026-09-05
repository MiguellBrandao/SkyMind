import { beforeEach, describe, expect, it, vi } from "vitest";
import { KnowledgeBaseError } from "../../../utils/errors";

const { mockEmbed, mockSearch } = vi.hoisted(() => ({ mockEmbed: vi.fn(), mockSearch: vi.fn() }));

vi.mock("../../../ai/providers/ProviderFactory", () => ({
  getEmbeddingProvider: () => ({ id: "fake", embed: mockEmbed }),
}));

vi.mock("../../../database/repositories/knowledgeRepository", () => ({
  knowledgeRepository: { search: mockSearch },
}));

import { searchKnowledge } from "./knowledgeSearch";

describe("searchKnowledge", () => {
  beforeEach(() => {
    mockEmbed.mockReset();
    mockSearch.mockReset();
  });

  it("embeds the query and forwards the vector to the repository search", async () => {
    mockEmbed.mockResolvedValue([[0.1, 0.2, 0.3]]);
    mockSearch.mockResolvedValue([{ title: "Catacombs", similarity: 0.9 }]);

    const results = await searchKnowledge("how do dungeons work", 5);

    expect(mockEmbed).toHaveBeenCalledWith(["how do dungeons work"]);
    expect(mockSearch).toHaveBeenCalledWith([0.1, 0.2, 0.3], 5);
    expect(results).toEqual([{ title: "Catacombs", similarity: 0.9 }]);
  });

  it("throws KnowledgeBaseError if the embedding provider returns nothing", async () => {
    mockEmbed.mockResolvedValue([]);
    await expect(searchKnowledge("query")).rejects.toBeInstanceOf(KnowledgeBaseError);
  });
});
