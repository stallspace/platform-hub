import { createClient } from '@supabase/supabase-js'

/**
 * Cookie-free, session-free Supabase client for genuinely public reads.
 *
 * `@/lib/supabase/server`'s createClient() calls next/headers cookies(), which
 * makes any caller dynamic. That is right for pages that depend on who is
 * logged in — and wrong for build-time or cached routes like sitemap.ts, where
 * touching cookies produces the "couldn't be rendered statically" build error.
 *
 * Uses the anon key, so RLS still applies: this can only read what the public
 * can already read (approved vendors, available products, categories).
 */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase public env vars are not configured.')
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
