import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StorefrontSettingsClient from '@/components/vendor/StorefrontSettingsClient'

export default async function VendorStorefrontPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, business_name, slug, business_description, business_category, city, province, logo_url, banner_url, social_links')
    .eq('user_id', user.id)
    .single()

  if (!vendor) redirect('/join')

  return <StorefrontSettingsClient vendor={vendor} />
}
