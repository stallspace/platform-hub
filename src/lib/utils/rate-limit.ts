/**
 * In-memory rate limiter keyed by an identifier (e.g. IP).
 *
 * This lives in one server process's memory, so on Netlify each cold start
 * gets a fresh bucket and concurrent instances don't share counts. Treat it
 * as a cheap first line only.
 *
 * For anything that must actually hold, use `limitRequest` from
 * `@/lib/utils/rate-limit-db`, which counts in Postgres and therefore
 * survives cold starts and is shared across instances.
 */
const buckets = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = buckets.get(key)

  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1 }
  }

  if (entry.count >= limit) return { allowed: false, remaining: 0 }

  entry.count += 1
  return { allowed: true, remaining: limit - entry.count }
}

/** Extract a best-effort client IP from request headers. */
export function clientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  )
}
