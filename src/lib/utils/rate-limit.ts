/**
 * Best-effort in-memory rate limiter keyed by an identifier (e.g. IP).
 *
 * NOTE: This lives in the server process memory, so it resets on redeploy and
 * is NOT shared across serverless instances. It stops casual abuse but for
 * production-grade limits back it with a durable store (e.g. Upstash Redis).
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
