// Best-effort in-memory limiter (per server instance). On Vercel, swap for Upstash/Redis for a shared limit.
const hits = new Map<string, { n: number; reset: number }>();
export function limited(key: string, max = 10, windowMs = 60_000) {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.reset < now) { hits.set(key, { n: 1, reset: now + windowMs }); if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k); return false; }
  h.n += 1;
  return h.n > max;
}
