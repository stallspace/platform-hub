import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import VendorLayoutClient from '@/components/vendor/VendorLayoutClient'

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, business_name, slug, status, subscription_plan, subscription_status, logo_url')
    .eq('user_id', user.id)
    .single()

  if (!vendor) redirect('/vendor/register')

  return (
    <VendorLayoutClient vendor={vendor}>
      {children}
    </VendorLayoutClient>
  )
}
