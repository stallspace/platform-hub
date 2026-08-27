// Reads live data / the user session, so it must never be statically rendered.
export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentVendor } from '@/lib/supabase/session'
import StoreSettingsClient from '@/components/vendor/StoreSettingsClient'

export default async function VendorStoreSettingsPage() {
  const vendor = await getCurrentVendor()
  if (!vendor) redirect('/join')

  const supabase = await createClient()

  const { data: settings } = await supabase
    .from('vendor_store_settings')
    .select('*')
    .eq('vendor_id', vendor.id)
    .single()

  return <StoreSettingsClient vendorId={vendor.id} settings={settings ?? null} />
}
