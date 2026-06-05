import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PaymentsClient from '@/components/vendor/PaymentsClient'

export default async function VendorPaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!vendor) redirect('/vendor/register')

  const { data: configs } = await supabase
    .from('vendor_payment_configs')
    .select('*')
    .eq('vendor_id', vendor.id)

  return <PaymentsClient vendorId={vendor.id} configs={configs ?? []} />
}
