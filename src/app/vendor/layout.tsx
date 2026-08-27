import { redirect } from 'next/navigation'
import { getCurrentUser, getCurrentVendor } from '@/lib/supabase/session'
import VendorLayoutClient from '@/components/vendor/VendorLayoutClient'

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  // Both lookups are request-cached, so the child page reuses them for free.
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')

  const vendor = await getCurrentVendor()
  if (!vendor) redirect('/join')

  return (
    <VendorLayoutClient vendor={vendor}>
      {children}
    </VendorLayoutClient>
  )
}
