const buckets = new Map<string, number[]>();

/**
 * Returns true if `key` has made fewer than `limit` calls within the last
 * `windowMs` milliseconds, and records this call if so.
 *
 * Caveat: this state lives in the memory of a single serverless function
 * instance. On Vercel, concurrent or cold-started instances don't share it,
 * so a determined caller could exceed the limit by hitting different
 * instances. For a hard guarantee, replace this with a shared store (Vercel
 * KV / Upstash Redis) - see the README's Phase 8 notes.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);

  if (timestamps.length >= limit) {
    buckets.set(key, timestamps);
    return false;
  }

  timestamps.push(now);
  buckets.set(key, timestamps);
  return true;
}
