import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

/**
 * Request-scoped, deduplicated session helpers.
 *
 * A single navigation renders the layout AND the page, and previously each of
 * them independently called `auth.getUser()` and looked up the vendor row —
 * doubling the number of round trips to Supabase. React's `cache()` memoises
 * the result for the lifetime of one request, so these now run once per
 * navigation no matter how many components ask for them.
 *
 * Security is unchanged: we still use `getUser()` (which verifies the JWT with
 * Supabase) rather than reading an unverified session from the cookie.
 */

export const getCurrentUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

/** The vendor record belonging to the signed-in user, or null. */
export const getCurrentVendor = cache(async () => {
  const user = await getCurrentUser()
  if (!user) return null
  const supabase = await createClient()
  // Select the whole row: different pages need different columns, and one
  // wider query is far cheaper than several narrow ones.
  const { data: vendor } = await supabase
    .from('vendors')
    .select('*')
    .eq('user_id', user.id)
    .single()
  return vendor
})

/** The signed-in user's profile (role, name), or null. */
export const getCurrentProfile = cache(async () => {
  const user = await getCurrentUser()
  if (!user) return null
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', user.id)
    .single()
  return profile
})
