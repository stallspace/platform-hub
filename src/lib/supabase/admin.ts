import { createClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client for trusted server-side routes ONLY.
 *
 * Bypasses Row-Level Security, so it must never be imported into a client
 * component and every route that uses it must do its own authorisation and
 * input validation. Never expose the returned client or its key to the browser.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service-role env vars are not configured.')
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
