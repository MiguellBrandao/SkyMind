export interface TextChunk {
  content: string;
}

export interface ChunkOptions {
  chunkSize?: number;
  overlap?: number;
}

/** Splits cleaned article text into overlapping chunks on line boundaries, sized for embedding. */
export function chunkText(text: string, options: ChunkOptions = {}): TextChunk[] {
  const chunkSize = options.chunkSize ?? 1200;
  const overlap = options.overlap ?? 150;
  const lines = text.split("\n").filter((line) => line.trim().length > 0);

  const chunks: string[] = [];
  let current = "";

  for (const line of lines) {
    const candidate = current.length > 0 ? `${current}\n${line}` : line;
    if (candidate.length > chunkSize && current.length > 0) {
      chunks.push(current.trim());
      const overlapText = current.slice(Math.max(0, current.length - overlap));
      current = `${overlapText}\n${line}`;
    } else {
      current = candidate;
    }
  }
  if (current.trim().length > 0) chunks.push(current.trim());

  return chunks.filter((c) => c.length > 30).map((content) => ({ content }));
}
