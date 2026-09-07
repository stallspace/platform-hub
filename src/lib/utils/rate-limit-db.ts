import { createServiceClient } from '@/lib/supabase/admin'
import { clientIp } from '@/lib/utils/rate-limit'

/**
 * Durable rate limiting, counted in Postgres.
 *
 * The in-process limiter in ./rate-limit.ts resets on every Netlify cold
 * start and isn't shared between concurrent instances, so under any real
 * load it stops limiting. This one increments a row inside a fixed window
 * via INSERT .. ON CONFLICT (see migration 010), which is atomic — parallel
 * instances cannot race past the limit.
 *
 * SERVER-SIDE ONLY — uses the service role.
 */

export interface LimitOptions {
  /** Distinct name for the thing being limited, e.g. 'orders'. */
  bucket: string
  /** Max requests allowed per window. */
  limit: number
  /** Window length in seconds. */
  windowSeconds: number
  /** Extra identity beyond the IP — a vendor id, an email. Optional. */
  subject?: string | null
}

/**
 * Returns true when the request may proceed.
 *
 * Fails OPEN: if the database is unreachable we allow the request rather than
 * taking checkout down to enforce an abuse limit. The limiter protects against
 * volume, not against a determined attacker who has also broken Postgres.
 */
export async function limitRequest(headers: Headers, opts: LimitOptions): Promise<boolean> {
  const ip = clientIp(headers)
  const key = [opts.bucket, ip, opts.subject ?? ''].join(':')

  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase.rpc('consume_rate_limit', {
      p_key: key,
      p_limit: opts.limit,
      p_window_s: opts.windowSeconds,
    })
    if (error) {
      console.error('[rate-limit]', opts.bucket, error.message)
      return true
    }
    return data !== false
  } catch (e) {
    console.error('[rate-limit]', opts.bucket, e)
    return true
  }
}

/** Standard 429 for a rejected request. */
export function tooManyRequests(message = 'Too many requests. Please wait a moment and try again.') {
  return Response.json({ error: message }, { status: 429 })
}
