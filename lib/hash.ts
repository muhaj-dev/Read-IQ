// A tiny, stable content fingerprint for per-note caches (podcast, quizzes) — so a
// note is only re-generated when its text changes. Not cryptographic.

/** Deterministic hash of a string (djb2 → base36) — a stable cache-invalidation key. */
export function hashContent(text: string): string {
  let hash = 5381;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 33) ^ text.charCodeAt(i);
  }
  // >>> 0 keeps it an unsigned 32-bit int so the base36 string is stable.
  return (hash >>> 0).toString(36);
}
