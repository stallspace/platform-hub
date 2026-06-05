import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EnquiriesClient from '@/components/vendor/EnquiriesClient'

export default async function VendorEnquiriesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, email')
    .eq('user_id', user.id)
    .single()

  if (!vendor) redirect('/vendor/register')

  const { data: enquiries } = await supabase
    .from('enquiries')
    .select('id, customer_name, customer_email, customer_phone, message, is_read, replied_at, created_at, product_id, products(name)')
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false })

  return (
    <EnquiriesClient
      enquiries={enquiries ?? []}
      vendorId={vendor.id}
      vendorEmail={vendor.email}
    />
  )
}
