const SUSPICIOUS_PATTERNS: RegExp[] = [
  /ignore (all|any|previous|the above)[^.\n]{0,40}instructions?/gi,
  /you are now/gi,
  /system\s*:/gi,
  /\bnew instructions?\b/gi,
  /disregard (all|any|previous)[^.\n]{0,40}(rules|instructions|prompts?)/gi,
  /act as (an?|the)\b/gi,
];

const DEFAULT_MAX_LENGTH = 2000;

/**
 * Defense-in-depth against prompt injection hidden in fetched wiki/Reddit content: neutralizes
 * common "ignore previous instructions"-style phrases and hard-caps length before the text is
 * ever placed into a tool result the model reads. This is a mitigation, not a guarantee - the
 * system prompt must also explicitly tell the model to never follow instructions found inside
 * retrieved content, especially from lower-trust sources like Reddit.
 */
export function sanitizeRetrievedContent(content: string, maxLength = DEFAULT_MAX_LENGTH): string {
  let sanitized = content;
  for (const pattern of SUSPICIOUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[REDACTED-POTENTIAL-INSTRUCTION]");
  }
  if (sanitized.length > maxLength) {
    sanitized = `${sanitized.slice(0, maxLength)}...`;
  }
  return sanitized;
}
