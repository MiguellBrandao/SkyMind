const DISCORD_MESSAGE_LIMIT = 2000;
const SAFE_CHUNK_SIZE = 1900; // headroom below Discord's hard 2000-char message limit
const MAX_CHUNKS = 6; // ~11.4K chars - comfortably above what maxOutputTokens (2048) can produce

/**
 * Splits long AI replies into Discord-message-sized chunks instead of truncating with "...".
 * Prefers breaking on a paragraph, then a line, then a space, so words/code blocks aren't cut
 * mid-way; falls back to a hard cut only if no good boundary exists in the window.
 */
export function chunkMessageText(text: string, maxLength = SAFE_CHUNK_SIZE): string[] {
  if (text.length <= maxLength) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > maxLength && chunks.length < MAX_CHUNKS - 1) {
    const window = remaining.slice(0, maxLength);
    let splitAt = window.lastIndexOf("\n\n");
    if (splitAt < maxLength * 0.4) splitAt = window.lastIndexOf("\n");
    if (splitAt < maxLength * 0.4) splitAt = window.lastIndexOf(" ");
    if (splitAt < maxLength * 0.4) splitAt = maxLength;

    chunks.push(remaining.slice(0, splitAt).trimEnd());
    remaining = remaining.slice(splitAt).trimStart();
  }

  if (remaining.length > 0) {
    if (remaining.length > maxLength) {
      // Hit MAX_CHUNKS - hard-cap the final chunk rather than sending an unbounded flood of messages.
      remaining = `${remaining.slice(0, maxLength - 20).trimEnd()}\n\n*(truncated)*`;
    }
    chunks.push(remaining);
  }

  return chunks;
}

export { DISCORD_MESSAGE_LIMIT, SAFE_CHUNK_SIZE };
