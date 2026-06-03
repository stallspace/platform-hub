'use client'

import { useEffect } from 'react'
import type { VendorApplication } from '@/app/admin/vendors/page'

interface Props {
  vendor: VendorApplication
  onClose: () => void
  onStatusChange: (id: string, status: VendorApplication['status'], label: string) => void
  actionLoading: string | null
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  under_review: 'bg-blue-100 text-blue-700 border-blue-200',
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  suspended: 'bg-gray-100 text-gray-600 border-gray-200',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  suspended: 'Suspended',
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</dt>
      <dd className="text-gray-800 text-sm">{value || <span className="text-gray-300 italic">Not provided</span>}</dd>
    </div>
  )
}

export default function VendorDetailModal({ vendor, onClose, onStatusChange, actionLoading }: Props) {
  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isLoading = (suffix: string) => actionLoading === vendor.id + suffix

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#0A1F44]/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#0A1F44]/5 border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              {vendor.logo_url ? (
                <img src={vendor.logo_url} alt={vendor.business_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[#0A1F44] font-black text-lg">
                  {vendor.business_name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-[#0A1F44]">{vendor.business_name}</h2>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_BADGE[vendor.status] ?? ''}`}
                >
                  {STATUS_LABEL[vendor.status] ?? vendor.status}
                </span>
              </div>
              <p className="text-gray-400 text-sm mt-0.5">Applied {formatDate(vendor.created_at)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100 flex-shrink-0 ml-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6">
          <div className="space-y-6">
            {/* Contact Info */}
            <section>
              <h3 className="text-xs font-bold text-[#0A1F44] uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-4 h-px bg-[#1D4ED8]" />
                Contact Information
              </h3>
              <dl className="grid grid-cols-2 gap-4">
                <Field label="Owner Name" value={vendor.owner_name} />
                <Field label="Email Address" value={vendor.email} />
                <Field label="Phone Number" value={vendor.phone} />
                <Field label="Business Address" value={vendor.business_address} />
              </dl>
            </section>

            {/* Business Info */}
            <section>
              <h3 className="text-xs font-bold text-[#0A1F44] uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-4 h-px bg-[#1D4ED8]" />
                Business Details
              </h3>
              <dl className="grid grid-cols-2 gap-4">
                <Field label="Company Registration" value={vendor.company_registration} />
                <Field label="Subscription Plan" value={vendor.subscription_plan} />
              </dl>
              <div className="mt-4">
                <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Business Description</dt>
                <dd className="text-gray-700 text-sm leading-relaxed bg-gray-50 rounded-lg p-3 border border-gray-100">
                  {vendor.business_description || <span className="text-gray-300 italic">Not provided</span>}
                </dd>
              </div>
            </section>
          </div>
        </div>

        {/* Footer — Action Buttons */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
          <div className="flex flex-wrap items-center gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Close
            </button>

            {/* Status-specific actions */}
            {vendor.status === 'pending' && (
              <button
                onClick={() => onStatusChange(vendor.id, 'under_review', 'marked as Under Review')}
                disabled={!!actionLoading}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
              >
                {isLoading('under_review') ? 'Updating...' : 'Mark as Under Review'}
              </button>
            )}

            {(vendor.status === 'pending' || vendor.status === 'under_review') && (
              <>
                <button
                  onClick={() => onStatusChange(vendor.id, 'rejected', 'rejected')}
                  disabled={!!actionLoading}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors disabled:opacity-50"
                >
                  {isLoading('rejected') ? 'Rejecting...' : 'Reject Application'}
                </button>
                <button
                  onClick={() => onStatusChange(vendor.id, 'approved', 'approved')}
                  disabled={!!actionLoading}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50"
                >
                  {isLoading('approved') ? 'Approving...' : '✓ Approve Vendor'}
                </button>
              </>
            )}

            {vendor.status === 'approved' && (
              <button
                onClick={() => onStatusChange(vendor.id, 'suspended', 'suspended')}
                disabled={!!actionLoading}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors disabled:opacity-50"
              >
                {isLoading('suspended') ? 'Suspending...' : 'Suspend Vendor'}
              </button>
            )}

            {vendor.status === 'suspended' && (
              <button
                onClick={() => onStatusChange(vendor.id, 'approved', 're-activated')}
                disabled={!!actionLoading}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50"
              >
                {isLoading('approved') ? 'Reactivating...' : 'Reactivate Vendor'}
              </button>
            )}

            {vendor.status === 'rejected' && (
              <button
                onClick={() => onStatusChange(vendor.id, 'pending', 'moved back to Pending')}
                disabled={!!actionLoading}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors disabled:opacity-50"
              >
                {isLoading('pending') ? 'Updating...' : 'Reconsider Application'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
