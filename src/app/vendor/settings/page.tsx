// Reads live data / the user session, so it must never be statically rendered.
export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getCurrentUser, getCurrentVendor } from '@/lib/supabase/session'
import SettingsClient from '@/components/vendor/SettingsClient'

export default async function VendorSettingsPage() {
  const [user, vendor] = await Promise.all([getCurrentUser(), getCurrentVendor()])
  if (!vendor) redirect('/join')

  return <SettingsClient vendor={vendor} userEmail={user?.email ?? ''} />
}
