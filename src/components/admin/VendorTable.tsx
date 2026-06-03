'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { VendorApplication } from '@/app/admin/vendors/page'
import VendorDetailModal from './VendorDetailModal'

const STATUS_TABS = [
  { key: 'pending',      label: 'Pending' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'approved',     label: 'Approved' },
  { key: 'rejected',     label: 'Rejected' },
  { key: 'suspended',    label: 'Suspended' },
  { key: 'all',          label: 'All' },
]

const STATUS_BADGE: Record<string, string> = {
  pending:      'bg-amber-100 text-amber-700 border-amber-200',
  under_review: 'bg-blue-100 text-blue-700 border-blue-200',
  approved:     'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected:     'bg-red-100 text-red-700 border-red-200',
  suspended:    'bg-gray-100 text-gray-600 border-gray-200',
}

const STATUS_LABEL: Record<string, string> = {
  pending:      'Pending',
  under_review: 'Under Review',
  approved:     'Approved',
  rejected:     'Rejected',
  suspended:    'Suspended',
}

interface VendorTableProps {
  vendors: VendorApplication[]
  activeStatus: string
  statusCounts: Record<string, number>
  searchQuery: string
}

export default function VendorTable({ vendors, activeStatus, statusCounts, searchQuery }: VendorTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [selectedVendor, setSelectedVendor] = useState<VendorApplication | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [search, setSearch] = useState(searchQuery)
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  function showToast(text: string, type: 'success' | 'error') {
    setToast({ text, type })
    setTimeout(() => setToast(null), 3500)
  }

  function navigate(params: Record<string, string>) {
    const next = new URLSearchParams(searchParams.toString())
    Object.entries(params).forEach(([k, v]) => v ? next.set(k, v) : next.delete(k))
    startTransition(() => router.push(`${pathname}?${next.toString()}`))
  }

  async function updateStatus(vendorId: string, newStatus: VendorApplication['status'], label: string) {
    setActionLoading(vendorId + newStatus)
    const supabase = createClient()
    const { error } = await supabase
      .from('vendors')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', vendorId)

    if (error) {
      showToast(`Failed: ${error.message}`, 'error')
    } else {
      showToast(`Vendor ${label} successfully.`, 'success')
      setSelectedVendor(null)
      startTransition(() => router.refresh())
    }
    setActionLoading(null)
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.type === 'success'
            ? <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            : <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          }
          {toast.text}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Search + Tabs */}
        <div className="border-b border-gray-100 px-5 pt-5">
          <div className="relative mb-4">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && navigate({ search, status: activeStatus })}
              placeholder="Search by business name, owner or email…"
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#1D4ED8] transition-colors"
            />
            {search && (
              <button onClick={() => { setSearch(''); navigate({ search: '', status: activeStatus }) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>

          <div className="flex gap-1 overflow-x-auto pb-px">
            {STATUS_TABS.map((tab) => {
              const count = tab.key === 'all'
                ? Object.values(statusCounts).reduce((a, b) => a + b, 0)
                : (statusCounts[tab.key] ?? 0)
              const active = activeStatus === tab.key
              return (
                <button key={tab.key} onClick={() => navigate({ status: tab.key, search })}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap border-b-2 transition-all ${
                    active ? 'border-[#1D4ED8] text-[#1D4ED8]' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}>
                  {tab.label}
                  {count > 0 && (
                    <span className={`text-xs rounded-full px-1.5 py-0.5 font-semibold ${
                      active ? 'bg-[#1D4ED8]/10 text-[#1D4ED8]' : 'bg-gray-100 text-gray-500'
                    }`}>{count}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Table */}
        {vendors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No applications found</p>
            <p className="text-gray-400 text-sm mt-1">
              {searchQuery ? 'Try adjusting your search.' : `No ${activeStatus !== 'all' ? activeStatus : ''} applications yet.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Business</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Owner</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Submitted</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#0A1F44]/5 border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {vendor.logo_url
                            ? <img src={vendor.logo_url} alt={vendor.business_name} className="w-full h-full object-cover" />
                            : <span className="text-[#0A1F44] font-bold text-sm">{vendor.business_name.charAt(0).toUpperCase()}</span>
                          }
                        </div>
                        <div>
                          <p className="font-semibold text-[#0A1F44]">{vendor.business_name}</p>
                          <p className="text-gray-400 text-xs">{vendor.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <p className="text-gray-700">{vendor.owner_name}</p>
                      <p className="text-gray-400 text-xs">{vendor.phone}</p>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell text-gray-500">{formatDate(vendor.created_at)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_BADGE[vendor.status] ?? ''}`}>
                        {STATUS_LABEL[vendor.status] ?? vendor.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setSelectedVendor(vendor)}
                          className="text-gray-400 hover:text-[#1D4ED8] transition-colors p-1.5 rounded-lg hover:bg-blue-50" title="View details">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>

                        {vendor.status === 'pending' && (
                          <button onClick={() => updateStatus(vendor.id, 'under_review', 'marked as Under Review')}
                            disabled={!!actionLoading}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors disabled:opacity-50">
                            {actionLoading === vendor.id + 'under_review' ? '...' : 'Review'}
                          </button>
                        )}

                        {(vendor.status === 'pending' || vendor.status === 'under_review') && (
                          <>
                            <button onClick={() => updateStatus(vendor.id, 'approved', 'approved')}
                              disabled={!!actionLoading}
                              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors disabled:opacity-50">
                              {actionLoading === vendor.id + 'approved' ? '...' : 'Approve'}
                            </button>
                            <button onClick={() => updateStatus(vendor.id, 'rejected', 'rejected')}
                              disabled={!!actionLoading}
                              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50">
                              {actionLoading === vendor.id + 'rejected' ? '...' : 'Reject'}
                            </button>
                          </>
                        )}

                        {vendor.status === 'approved' && (
                          <button onClick={() => updateStatus(vendor.id, 'suspended', 'suspended')}
                            disabled={!!actionLoading}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200 transition-colors disabled:opacity-50">
                            {actionLoading === vendor.id + 'suspended' ? '...' : 'Suspend'}
                          </button>
                        )}

                        {vendor.status === 'suspended' && (
                          <button onClick={() => updateStatus(vendor.id, 'approved', 're-activated')}
                            disabled={!!actionLoading}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors disabled:opacity-50">
                            {actionLoading === vendor.id + 'approved' ? '...' : 'Reactivate'}
                          </button>
                        )}

                        {vendor.status === 'rejected' && (
                          <button onClick={() => updateStatus(vendor.id, 'pending', 'moved back to Pending')}
                            disabled={!!actionLoading}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors disabled:opacity-50">
                            {actionLoading === vendor.id + 'pending' ? '...' : 'Reconsider'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {vendors.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 text-right">
            <p className="text-xs text-gray-400">Showing {vendors.length} application{vendors.length !== 1 ? 's' : ''}</p>
          </div>
        )}
      </div>

      {selectedVendor && (
        <VendorDetailModal
          vendor={selectedVendor}
          onClose={() => setSelectedVendor(null)}
          onStatusChange={updateStatus}
          actionLoading={actionLoading}
        />
      )}
    </>
  )
}
