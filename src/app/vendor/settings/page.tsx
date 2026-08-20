import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SettingsClient from '@/components/vendor/SettingsClient'

export default async function VendorSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, business_name, owner_name, email, phone, business_address, company_registration')
    .eq('user_id', user.id)
    .single()

  if (!vendor) redirect('/join')

  return <SettingsClient vendor={vendor} userEmail={user.email ?? ''} />
}
