import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StoreSettingsClient from '@/components/vendor/StoreSettingsClient'

export default async function VendorStoreSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!vendor) redirect('/vendor/register')

  const { data: settings } = await supabase
    .from('vendor_store_settings')
    .select('*')
    .eq('vendor_id', vendor.id)
    .single()

  return <StoreSettingsClient vendorId={vendor.id} settings={settings ?? null} />
}
