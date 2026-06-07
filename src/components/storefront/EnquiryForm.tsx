'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fireNotification } from '@/lib/notifications/fire'

interface Props {
  vendorId: string
  vendorEmail: string
  productId?: string | null
  productName?: string | null
}

export default function EnquiryForm({ vendorId, vendorEmail, productId, productName }: Props) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in your name, email and message.')
      return
    }
    setError(null)
    setSubmitting(true)

    const supabase = createClient()
    const { data, error: insertError } = await supabase
      .from('enquiries')
      .insert({
        vendor_id: vendorId,
        product_id: productId ?? null,
        customer_name: form.name.trim(),
        customer_email: form.email.trim(),
        customer_phone: form.phone.trim() || null,
        message: form.message.trim(),
        is_read: false,
      })
      .select('id')
      .single()

    if (insertError || !data) {
      setError('Failed to send enquiry. Please try again.')
      setSubmitting(false)
      return
    }

    // Fire notification to vendor (fire-and-forget)
    fireNotification('enquiry.new', { enquiryId: data.id })

    setSubmitted(true)
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="bg-brand-navy rounded-xl p-5 text-center">
        <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-white font-semibold text-sm">Enquiry sent!</p>
        <p className="text-gray-400 text-xs mt-1">The vendor will be in touch with you soon.</p>
        <button
          onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', message: '' }) }}
          className="mt-4 text-xs text-gray-400 hover:text-white transition-colors underline"
        >
          Send another
        </button>
      </div>
    )
  }

  return (
    <div className="bg-brand-navy rounded-xl p-5">
      <h2 className="font-semibold text-white mb-1">Send an Enquiry</h2>
      {productName && (
        <p className="text-xs text-[#1D4ED8] mb-3">Re: {productName}</p>
      )}
      {!productName && (
        <p className="text-gray-400 text-xs mb-3">Have a question? Contact this vendor directly.</p>
      )}

      <div className="space-y-2.5">
        <input
          type="text"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Your name *"
          className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:border-[#1D4ED8] transition-colors"
        />
        <input
          type="email"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          placeholder="Email address *"
          className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:border-[#1D4ED8] transition-colors"
        />
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => set('phone', e.target.value)}
          placeholder="Phone number (optional)"
          className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:border-[#1D4ED8] transition-colors"
        />
        <textarea
          value={form.message}
          onChange={(e) => set('message', e.target.value)}
          placeholder="Your message *"
          rows={3}
          className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:border-[#1D4ED8] transition-colors resize-none"
        />

        {error && (
          <p className="text-red-400 text-xs">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-[#1D4ED8] hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {submitting ? 'Sending...' : 'Send Enquiry'}
        </button>
      </div>
    </div>
  )
}
