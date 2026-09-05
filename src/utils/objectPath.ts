/** Safely reads a nested path (e.g. "player_data.experience.SKILL_FARMING") from an unknown object. */
export function getPath<T = unknown>(obj: unknown, path: string, fallback: T): T {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== "object") {
      return fallback;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current === undefined || current === null ? fallback : (current as T);
}

export function firstDefinedPath<T = unknown>(obj: unknown, paths: string[], fallback: T): T {
  for (const path of paths) {
    const value = getPath<T | undefined>(obj, path, undefined);
    if (value !== undefined) return value;
  }
  return fallback;
}
