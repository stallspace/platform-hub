'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { fireNotification } from '@/lib/notifications/fire'

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

const PLAN_BADGE: Record<string, string> = {
  starter: 'bg-sky-50 text-sky-700 border-sky-200',
  growth:  'bg-violet-50 text-violet-700 border-violet-200',
  premium: 'bg-amber-50 text-amber-700 border-amber-200',
}

const PLAN_PRICES: Record<string, number> = { starter: 250, growth: 500, premium: 1000 }

interface Vendor {
  id: string
  business_name: string
  owner_name: string
  email: string
  phone: string
  business_address: string
  company_registration: string | null
  business_description: string
  logo_url: string | null
  banner_url: string | null
  status: string
  subscription_plan: string | null
  subscription_status: string | null
  subscription_next_billing: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string | null
  slug: string
  social_links: Record<string, string> | null
  vendor_documents: { id: string; file_url: string; file_name: string; file_type: string }[]
}

interface SubscriptionEvent {
  id: string
  event_type: string
  amount: number | null
  created_at: string
  provider_reference: string | null
}

interface TopProduct {
  id: string
  name: string
  price: number
  images: string[]
  view_count: number
  is_available: boolean
}

interface Review {
  id: string
  customer_name: string
  rating: number
  comment: string | null
  is_approved: boolean
  created_at: string
}

interface Props {
  vendor: Vendor
  events: SubscriptionEvent[]
  productCount: number
  enquiryCount: number
  topProducts: TopProduct[]
  reviews: Review[]
  storeViewCount: number
  avgRating: number | null
}

type Tab = 'details' | 'documents' | 'subscription' | 'performance' | 'notes'

export default function VendorDetailClient({
  vendor, events, productCount, enquiryCount,
  topProducts, reviews, storeViewCount, avgRating,
}: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState(vendor.admin_notes ?? '')
  const [savingNotes, setSavingNotes] = useState(false)
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('details')

  // Admin-managed subscription controls
  const [subPlan, setSubPlan] = useState(vendor.subscription_plan ?? '')
  const [subStatus, setSubStatus] = useState(vendor.subscription_status ?? '')
  const [subNextBilling, setSubNextBilling] = useState(
    vendor.subscription_next_billing ? vendor.subscription_next_billing.slice(0, 10) : ''
  )
  const [savingSub, setSavingSub] = useState(false)

  function showToast(text: string, type: 'success' | 'error') {
    setToast({ text, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function saveSubscription() {
    setSavingSub(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('vendors')
      .update({
        subscription_plan: subPlan || null,
        subscription_status: subStatus || null,
        subscription_next_billing: subNextBilling ? new Date(subNextBilling).toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', vendor.id)
    if (error) showToast(`Failed: ${error.message}`, 'error')
    else { showToast('Subscription updated.', 'success'); startTransition(() => router.refresh()) }
    setSavingSub(false)
  }

  // Record a manual subscription payment: logs a billing event, sets status
  // active, and advances next billing by one month.
  async function recordPayment() {
    if (!subPlan) { showToast('Select a plan first.', 'error'); return }
    setSavingSub(true)
    const supabase = createClient()
    const amount = PLAN_PRICES[subPlan] ?? 0
    const base = subNextBilling ? new Date(subNextBilling) : new Date()
    const next = new Date(base)
    next.setMonth(next.getMonth() + 1)

    const { error: evErr } = await supabase.from('subscription_events').insert({
      vendor_id: vendor.id,
      event_type: 'charge_success',
      amount,
      provider_reference: 'manual',
    })
    const { error: vErr } = await supabase
      .from('vendors')
      .update({
        subscription_plan: subPlan,
        subscription_status: 'active',
        subscription_next_billing: next.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', vendor.id)

    if (evErr || vErr) showToast(`Failed: ${(evErr ?? vErr)?.message}`, 'error')
    else {
      setSubStatus('active')
      setSubNextBilling(next.toISOString().slice(0, 10))
      showToast(`Payment of R${amount} recorded.`, 'success')
      startTransition(() => router.refresh())
    }
    setSavingSub(false)
  }

  // Give the vendor 3 free months: active now, first payment due in 3 months.
  async function startFreeTrial() {
    setSavingSub(true)
    const supabase = createClient()
    const plan = subPlan || 'starter'
    const next = new Date()
    next.setMonth(next.getMonth() + 3)
    const { error } = await supabase
      .from('vendors')
      .update({
        subscription_plan: plan,
        subscription_status: 'active',
        subscription_next_billing: next.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', vendor.id)
    if (error) showToast(`Failed: ${error.message}`, 'error')
    else {
      setSubPlan(plan)
      setSubStatus('active')
      setSubNextBilling(next.toISOString().slice(0, 10))
      showToast('3-month free trial started. First payment due in 3 months.', 'success')
      startTransition(() => router.refresh())
    }
    setSavingSub(false)
  }

  // Email the vendor a subscription payment reminder (no debit order — manual).
  async function sendReminder() {
    if (!subPlan) { showToast('Set a plan first.', 'error'); return }
    setSavingSub(true)
    try {
      await fireNotification('subscription.reminder', { vendorId: vendor.id })
      showToast('Payment reminder sent to vendor.', 'success')
    } catch {
      showToast('Failed to send reminder.', 'error')
    }
    setSavingSub(false)
  }

  async function updateStatus(newStatus: string, label: string) {
    setActionLoading(newStatus)
    const supabase = createClient()
    const { error } = await supabase
      .from('vendors')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', vendor.id)

    if (error) {
      showToast(`Failed: ${error.message}`, 'error')
    } else {
      showToast(`Vendor ${label} successfully.`, 'success')
      const isReactivation = newStatus === 'approved' && vendor.status === 'suspended'
      const eventMap: Record<string, string> = {
        approved:  'vendor.approved',
        rejected:  'vendor.rejected',
        suspended: 'vendor.suspended',
      }
      const event = isReactivation ? 'vendor.reactivated' : (eventMap[newStatus] ?? null)
      if (event) fireNotification(event, { vendorId: vendor.id })
      startTransition(() => router.refresh())
    }
    setActionLoading(null)
  }

  async function saveNotes() {
    setSavingNotes(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('vendors')
      .update({ admin_notes: adminNotes })
      .eq('id', vendor.id)
    if (error) {
      showToast('Failed to save notes.', 'error')
    } else {
      showToast('Notes saved.', 'success')
    }
    setSavingNotes(false)
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'details',      label: 'Details' },
    { key: 'performance',  label: 'Performance' },
    { key: 'documents',    label: `Documents (${vendor.vendor_documents?.length ?? 0})` },
    { key: 'subscription', label: 'Subscription' },
    { key: 'notes',        label: 'Admin Notes' },
  ]

  const approvedReviews = reviews.filter((r) => r.is_approved)
  const pendingReviews  = reviews.filter((r) => !r.is_approved)

  return (
    <>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Profile + actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {vendor.banner_url
              ? <div className="h-20 bg-cover bg-center" style={{ backgroundImage: `url(${vendor.banner_url})` }} />
              : <div className="h-20 bg-gradient-to-br from-[#0D3B2E] to-[#2ECC8E]" />
            }
            <div className="px-5 pb-5">
              <div className="-mt-8 mb-3">
                <div className="w-16 h-16 rounded-xl border-2 border-white shadow bg-white flex items-center justify-center overflow-hidden">
                  {vendor.logo_url
                    ? <img src={vendor.logo_url} alt={vendor.business_name} className="w-full h-full object-cover" />
                    : <span className="text-[#0D3B2E] font-black text-2xl">{vendor.business_name.charAt(0)}</span>
                  }
                </div>
              </div>
              <h2 className="font-bold text-[#0D3B2E] text-lg">{vendor.business_name}</h2>
              <p className="text-gray-500 text-sm">{vendor.email}</p>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_BADGE[vendor.status] ?? ''}`}>
                  {STATUS_LABEL[vendor.status] ?? vendor.status}
                </span>
                {vendor.subscription_plan && (
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${PLAN_BADGE[vendor.subscription_plan] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                    {vendor.subscription_plan}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Products',    value: productCount },
              { label: 'Enquiries',   value: enquiryCount },
              { label: 'Store Views', value: storeViewCount },
              { label: 'Reviews',     value: approvedReviews.length },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                <p className="text-2xl font-bold text-[#0D3B2E]">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Actions</p>

            {(vendor.status === 'pending' || vendor.status === 'under_review') && (
              <button onClick={() => updateStatus('approved', 'approved')} disabled={!!actionLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-50">
                {actionLoading === 'approved' ? 'Approving...' : 'Approve Vendor'}
              </button>
            )}

            {vendor.status === 'pending' && (
              <button onClick={() => updateStatus('under_review', 'marked as Under Review')} disabled={!!actionLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-sm font-semibold transition-colors disabled:opacity-50">
                {actionLoading === 'under_review' ? 'Updating...' : 'Mark Under Review'}
              </button>
            )}

            {(vendor.status === 'pending' || vendor.status === 'under_review') && (
              <button onClick={() => updateStatus('rejected', 'rejected')} disabled={!!actionLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-sm font-semibold transition-colors disabled:opacity-50">
                {actionLoading === 'rejected' ? 'Rejecting...' : 'Reject Application'}
              </button>
            )}

            {vendor.status === 'approved' && (
              <button onClick={() => updateStatus('suspended', 'suspended')} disabled={!!actionLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 text-sm font-semibold transition-colors disabled:opacity-50">
                {actionLoading === 'suspended' ? 'Suspending...' : 'Suspend Vendor'}
              </button>
            )}

            {vendor.status === 'suspended' && (
              <button onClick={() => updateStatus('approved', 're-activated')} disabled={!!actionLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-50">
                {actionLoading === 'approved' ? 'Reactivating...' : 'Reactivate Vendor'}
              </button>
            )}

            {vendor.status === 'rejected' && (
              <button onClick={() => updateStatus('pending', 'moved back to Pending')} disabled={!!actionLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-sm font-semibold transition-colors disabled:opacity-50">
                {actionLoading === 'pending' ? 'Updating...' : 'Reconsider Application'}
              </button>
            )}

            <a href={`/marketplace/store/${vendor.slug}`} target="_blank" rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold transition-colors flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Storefront
            </a>
          </div>
        </div>

        {/* Right: Tabs */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex border-b border-gray-100 overflow-x-auto">
              {TABS.map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                    activeTab === tab.key ? 'border-[#2ECC8E] text-[#2ECC8E]' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">

              {/* ── Details ── */}
              {activeTab === 'details' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {[
                      { label: 'Business Name',        value: vendor.business_name },
                      { label: 'Owner Name',            value: vendor.owner_name },
                      { label: 'Email Address',         value: vendor.email },
                      { label: 'Phone Number',          value: vendor.phone },
                      { label: 'Business Address',      value: vendor.business_address },
                      { label: 'Company Registration',  value: vendor.company_registration ?? 'Not provided' },
                      { label: 'Member Since',          value: formatDate(vendor.created_at) },
                      { label: 'Last Updated',          value: vendor.updated_at ? formatDate(vendor.updated_at) : '—' },
                    ].map((field) => (
                      <div key={field.label}>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{field.label}</p>
                        <p className="text-sm text-gray-800">{field.value}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Business Description</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{vendor.business_description}</p>
                  </div>
                  {vendor.social_links && Object.keys(vendor.social_links).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Social Links</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(vendor.social_links).map(([platform, url]) => url ? (
                          <a key={platform} href={String(url)} target="_blank" rel="noopener noreferrer"
                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-[#2ECC8E] hover:border-[#2ECC8E] transition-colors capitalize">
                            {platform}
                          </a>
                        ) : null)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Performance ── */}
              {activeTab === 'performance' && (
                <div className="space-y-6">
                  {/* Summary stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Store Views',  value: storeViewCount,          color: 'text-brand-mint' },
                      { label: 'Products',     value: productCount,            color: 'text-purple-600' },
                      { label: 'Enquiries',    value: enquiryCount,            color: 'text-amber-600' },
                      { label: 'Avg Rating',   value: avgRating ? avgRating.toFixed(1) + ' ★' : 'N/A', color: 'text-emerald-600' },
                    ].map((s) => (
                      <div key={s.label} className="bg-gray-50 rounded-xl p-4 text-center">
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Top products by views */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Top Products by Views</p>
                    {topProducts.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">No products listed yet</p>
                    ) : (
                      <div className="space-y-2">
                        {topProducts.map((p) => (
                          <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                              {p.images?.[0]
                                ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">📦</div>
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                              <p className="text-xs text-gray-400">R {p.price.toFixed(2)} · {p.is_available ? 'Available' : 'Unavailable'}</p>
                            </div>
                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-[#2ECC8E]/10 text-[#2ECC8E] flex-shrink-0">
                              {p.view_count} views
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Reviews */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Reviews</p>
                      {pendingReviews.length > 0 && (
                        <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                          {pendingReviews.length} pending approval
                        </span>
                      )}
                    </div>
                    {reviews.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">No reviews yet</p>
                    ) : (
                      <div className="space-y-2">
                        {reviews.slice(0, 5).map((r) => (
                          <div key={r.id} className={`p-3 rounded-xl border ${r.is_approved ? 'border-gray-100' : 'border-amber-200 bg-amber-50/30'}`}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-800">{r.customer_name}</span>
                                <span className="text-xs text-amber-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {!r.is_approved && (
                                  <span className="text-xs text-amber-600 font-semibold">Pending</span>
                                )}
                                <span className="text-xs text-gray-400">{formatDate(r.created_at)}</span>
                              </div>
                            </div>
                            {r.comment && <p className="text-xs text-gray-600 leading-relaxed">{r.comment}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Documents ── */}
              {activeTab === 'documents' && (
                <div>
                  {(!vendor.vendor_documents || vendor.vendor_documents.length === 0) ? (
                    <div className="text-center py-12">
                      <p className="text-sm text-gray-500">No documents submitted</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {vendor.vendor_documents.map((doc) => (
                        <a key={doc.id} href={doc.file_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-[#2ECC8E] hover:bg-blue-50/30 transition-all group">
                          <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-gray-500 group-hover:text-[#2ECC8E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{doc.file_name}</p>
                            <p className="text-xs text-gray-400 uppercase">{doc.file_type}</p>
                          </div>
                          <svg className="w-4 h-4 text-gray-400 group-hover:text-[#2ECC8E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Subscription ── */}
              {activeTab === 'subscription' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: 'Plan',         value: vendor.subscription_plan ? vendor.subscription_plan.charAt(0).toUpperCase() + vendor.subscription_plan.slice(1) : 'No plan' },
                      { label: 'Status',       value: vendor.subscription_status ?? 'N/A' },
                      { label: 'Next Billing', value: vendor.subscription_next_billing ? formatDate(vendor.subscription_next_billing) : 'N/A' },
                    ].map((item) => (
                      <div key={item.label} className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{item.label}</p>
                        <p className="text-sm font-semibold text-gray-800 capitalize">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  {/* Admin-managed subscription controls */}
                  <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Manage Subscription</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Plan</label>
                        <select value={subPlan} onChange={(e) => setSubPlan(e.target.value)}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
                          <option value="">No plan</option>
                          <option value="starter">Starter — R250 (20 products)</option>
                          <option value="growth">Growth — R500 (50 products)</option>
                          <option value="premium">Premium — R1000 (unlimited)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Status</label>
                        <select value={subStatus} onChange={(e) => setSubStatus(e.target.value)}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
                          <option value="">None</option>
                          <option value="active">Active</option>
                          <option value="past_due">Past Due</option>
                          <option value="suspended">Suspended</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Next Billing</label>
                        <input type="date" value={subNextBilling} onChange={(e) => setSubNextBilling(e.target.value)}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <button onClick={startFreeTrial} disabled={savingSub}
                        className="px-4 py-2 bg-brand-mint hover:bg-brand-forest text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
                        Start 3-Month Free Trial
                      </button>
                      <button onClick={saveSubscription} disabled={savingSub}
                        className="px-4 py-2 bg-[#0D3B2E] hover:bg-[#0d2a5e] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
                        {savingSub ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button onClick={recordPayment} disabled={savingSub}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
                        Record Payment (+1 month)
                      </button>
                      <button onClick={sendReminder} disabled={savingSub}
                        className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
                        Send Payment Reminder
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Billing History</p>
                    {events.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6">No billing events recorded</p>
                    ) : (
                      <div className="space-y-2">
                        {events.map((event) => (
                          <div key={event.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl border border-gray-100">
                            <div>
                              <p className="text-sm font-medium text-gray-800 capitalize">{event.event_type.replace(/_/g, ' ')}</p>
                              <p className="text-xs text-gray-400">{formatDate(event.created_at)}</p>
                            </div>
                            {event.amount != null && (
                              <span className="text-sm font-bold text-gray-800">R {event.amount.toFixed(2)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Notes ── */}
              {activeTab === 'notes' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">Internal notes — not visible to the vendor.</p>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={8}
                    placeholder="Add internal notes about this vendor..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#2ECC8E] transition-colors resize-none"
                  />
                  <div className="flex justify-end">
                    <button onClick={saveNotes} disabled={savingNotes}
                      className="px-5 py-2.5 bg-[#0D3B2E] hover:bg-[#0d2a5e] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
                      {savingNotes ? 'Saving...' : 'Save Notes'}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  )
}
