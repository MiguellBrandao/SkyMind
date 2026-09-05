const SUSPICIOUS_PATTERNS: RegExp[] = [
  /ignore (all|any|previous|the above)[^.\n]{0,40}instructions?/gi,
  /you are now/gi,
  /system\s*:/gi,
  /\bnew instructions?\b/gi,
  /disregard (all|any|previous)[^.\n]{0,40}(rules|instructions|prompts?)/gi,
  /act as (an?|the)\b/gi,
];

const MAX_CONTENT_LENGTH = 2000;

/**
 * Defense-in-depth against prompt injection hidden in ingested wiki content: neutralizes
 * common "ignore previous instructions"-style phrases and hard-caps length before the text
 * is ever placed into a tool result the model reads. This is a mitigation, not a guarantee -
 * the system prompt must also explicitly tell the model to never follow instructions found
 * inside retrieved documents.
 */
export function sanitizeRetrievedContent(content: string): string {
  let sanitized = content;
  for (const pattern of SUSPICIOUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[REDACTED-POTENTIAL-INSTRUCTION]");
  }
  if (sanitized.length > MAX_CONTENT_LENGTH) {
    sanitized = `${sanitized.slice(0, MAX_CONTENT_LENGTH)}...`;
  }
  return sanitized;
}
