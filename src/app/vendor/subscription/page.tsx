import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SubscriptionClient from '@/components/vendor/SubscriptionClient'

export default async function VendorSubscriptionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, business_name, subscription_plan, subscription_status, subscription_id, subscription_next_billing')
    .eq('user_id', user.id)
    .single()

  if (!vendor) redirect('/join')

  return <SubscriptionClient vendor={vendor} />
}
