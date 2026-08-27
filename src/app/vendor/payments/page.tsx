// Reads live data / the user session, so it must never be statically rendered.
export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentVendor } from '@/lib/supabase/session'
import PaymentsClient from '@/components/vendor/PaymentsClient'

export default async function VendorPaymentsPage() {
  const vendor = await getCurrentVendor()
  if (!vendor) redirect('/join')

  const supabase = await createClient()

  // Credentials are loaded (masked) by the client via the secured API route.
  return <PaymentsClient vendorId={vendor.id} />
}
