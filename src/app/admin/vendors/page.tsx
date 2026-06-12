import { createClient } from '@/lib/supabase/server'
import VendorTable from '@/components/admin/VendorTable'

export const dynamic = 'force-dynamic'

export type VendorApplication = {
  id: string
  business_name: string
  owner_name: string
  email: string
  phone: string
  business_address: string
  company_registration: string | null
  business_description: string
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'suspended'
  created_at: string
  updated_at: string | null
  logo_url: string | null
  subscription_plan: string | null
}

export default async function VendorApplicationsPage({
  searchParams,
}: {
  searchParams: { status?: string; search?: string }
}) {
  const supabase = await createClient()

  const statusFilter = searchParams.status ?? 'pending'
  const searchQuery = searchParams.search ?? ''

  let query = supabase
    .from('vendors')
    .select('*')
    .order('created_at', { ascending: false })

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  if (searchQuery) {
    query = query.or(
      `business_name.ilike.%${searchQuery}%,owner_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`
    )
  }

  const { data: vendors, error } = await query

  // Status counts for tab badges
  const { data: allVendors } = await supabase.from('vendors').select('status')

  const statusCounts: Record<string, number> = {}
  if (allVendors) {
    for (const row of allVendors) {
      statusCounts[row.status] = (statusCounts[row.status] ?? 0) + 1
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0D3B2E]">Vendor Applications</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Review, approve, or reject vendor applications to the Stallspace marketplace.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Pending',      key: 'pending',      color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-100' },
          { label: 'Under Review', key: 'under_review', color: 'text-brand-mint',    bg: 'bg-blue-50 border-blue-100' },
          { label: 'Approved',     key: 'approved',     color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
          { label: 'Rejected',     key: 'rejected',     color: 'text-red-600',     bg: 'bg-red-50 border-red-100' },
        ].map((stat) => (
          <div key={stat.key} className={`${stat.bg} border rounded-xl p-4`}>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">{stat.label}</p>
            <p className={`text-3xl font-black mt-1 ${stat.color}`}>
              {statusCounts[stat.key] ?? 0}
            </p>
          </div>
        ))}
      </div>

      <VendorTable
        vendors={(vendors as VendorApplication[]) ?? []}
        activeStatus={statusFilter}
        statusCounts={statusCounts}
        searchQuery={searchQuery}
      />

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">Error loading vendors: {error.message}</p>
        </div>
      )}
    </div>
  )
}
