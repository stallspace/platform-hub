// Reads live data / the user session, so it must never be statically rendered.
export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentVendor } from '@/lib/supabase/session'
import SubscriptionClient from '@/components/vendor/SubscriptionClient'

export default async function VendorSubscriptionPage() {
  const vendor = await getCurrentVendor()
  if (!vendor) redirect('/join')

  const supabase = await createClient()

  return <SubscriptionClient vendor={vendor} />
}
