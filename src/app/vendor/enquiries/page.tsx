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

  if (!vendor) redirect('/join')

  const { data: enquiries } = await supabase
    .from('enquiries')
    .select('id, customer_name, customer_email, customer_phone, message, is_read, replied_at, created_at, product_id, products(name)')
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false })

  return (
    <EnquiriesClient
      // Supabase types the to-one products join as an array; the runtime shape matches the client's expectations.
      enquiries={(enquiries ?? []) as unknown as Parameters<typeof EnquiriesClient>[0]['enquiries']}
      vendorId={vendor.id}
      vendorEmail={vendor.email}
    />
  )
}
