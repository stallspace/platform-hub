'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, Mail, Phone, Package, Clock, CheckCircle, Reply } from 'lucide-react'

interface Enquiry {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  message: string
  is_read: boolean
  replied_at: string | null
  created_at: string
  product_id: string | null
  products?: { name: string } | null
}

interface Props {
  enquiries: Enquiry[]
  vendorId: string
  vendorEmail: string
}

export default function EnquiriesClient({ enquiries: initial, vendorId, vendorEmail }: Props) {
  const supabase = createClient()
  const [enquiries, setEnquiries] = useState(initial)
  const [selected, setSelected] = useState<Enquiry | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [toast, setToast] = useState<string | null>(null)

  const unreadCount = enquiries.filter(e => !e.is_read).length

  const filtered = enquiries.filter(e => {
    if (filter === 'unread') return !e.is_read
    if (filter === 'read') return e.is_read
    return true
  })

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function openEnquiry(enquiry: Enquiry) {
    setSelected(enquiry)
    setReplyText('')
    if (!enquiry.is_read) {
      await supabase.from('enquiries').update({ is_read: true }).eq('id', enquiry.id)
      setEnquiries(prev => prev.map(e => e.id === enquiry.id ? { ...e, is_read: true } : e))
    }
  }

  async function sendReply() {
    if (!selected || !replyText.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/vendor/reply-enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enquiryId: selected.id,
          toEmail: selected.customer_email,
          toName: selected.customer_name,
          replyText: replyText.trim(),
          vendorEmail,
        }),
      })
      if (!res.ok) throw new Error('Failed to send')

      const repliedAt = new Date().toISOString()
      await supabase.from('enquiries').update({ replied_at: repliedAt, is_read: true }).eq('id', selected.id)
      setEnquiries(prev => prev.map(e => e.id === selected.id ? { ...e, replied_at: repliedAt, is_read: true } : e))
      setSelected(prev => prev ? { ...prev, replied_at: repliedAt } : prev)
      setReplyText('')
      showToast('Reply sent successfully')
    } catch {
      showToast('Failed to send reply. Please try again.')
    } finally {
      setSending(false)
    }
  }

  function formatDate(iso: string) {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="h-full">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-sm px-4 py-3 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enquiries</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        <div className="flex gap-2">
          {(['all', 'unread', 'read'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filter === f
                  ? 'bg-brand-navy text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'unread' && unreadCount > 0 && (
                <span className="ml-1.5 bg-brand-accent text-white text-xs rounded-full px-1.5 py-0.5">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-6 h-[calc(100vh-200px)]">
        <div className="w-96 flex-shrink-0 bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col">
          {filtered.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
              <MessageSquare className="w-10 h-10 opacity-30" />
              <p className="text-sm">No enquiries {filter !== 'all' ? `(${filter})` : ''}</p>
            </div>
          ) : (
            <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
              {filtered.map(enquiry => (
                <button
                  key={enquiry.id}
                  onClick={() => openEnquiry(enquiry)}
                  className={`w-full text-left px-4 py-3.5 hover:bg-gray-50 transition-colors ${
                    selected?.id === enquiry.id ? 'bg-blue-50 border-r-2 border-brand-accent' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      {!enquiry.is_read && (
                        <span className="w-2 h-2 bg-brand-accent rounded-full flex-shrink-0 mt-1" />
                      )}
                      <span className={`text-sm truncate ${!enquiry.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {enquiry.customer_name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(enquiry.created_at)}</span>
                  </div>
                  {enquiry.products && (
                    <div className="flex items-center gap-1 text-xs text-brand-accent mb-1 ml-4">
                      <Package className="w-3 h-3" />
                      <span className="truncate">{enquiry.products.name}</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 truncate ml-4">{enquiry.message}</p>
                  {enquiry.replied_at && (
                    <div className="flex items-center gap-1 text-xs text-green-600 mt-1 ml-4">
                      <CheckCircle className="w-3 h-3" />
                      <span>Replied</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
              <MessageSquare className="w-12 h-12 opacity-20" />
              <p className="text-sm">Select an enquiry to view</p>
            </div>
          ) : (
            <>
              <div className="p-5 border-b border-gray-100 flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900 text-lg">{selected.customer_name}</h2>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <a href={`mailto:${selected.customer_email}`} className="flex items-center gap-1 text-sm text-brand-accent hover:underline">
                      <Mail className="w-3.5 h-3.5" />
                      {selected.customer_email}
                    </a>
                    {selected.customer_phone && (
                      <a href={`tel:${selected.customer_phone}`} className="flex items-center gap-1 text-sm text-gray-500 hover:underline">
                        <Phone className="w-3.5 h-3.5" />
                        {selected.customer_phone}
                      </a>
                    )}
                  </div>
                  {selected.products && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <Package className="w-3.5 h-3.5" />
                      Re: {selected.products.name}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDate(selected.created_at)}
                </div>
              </div>

              <div className="flex-1 p-5 overflow-y-auto">
                <div className="bg-gray-50 rounded-xl p-4 max-w-2xl">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selected.message}</p>
                </div>
                {selected.replied_at && (
                  <div className="flex items-center gap-2 mt-4 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    Replied on {new Date(selected.replied_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                )}
              </div>

              <div className="p-5 border-t border-gray-100">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder={`Reply to ${selected.customer_name}...`}
                      rows={3}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent"
                    />
                  </div>
                  <button
                    onClick={sendReply}
                    disabled={!replyText.trim() || sending}
                    className="flex items-center gap-2 px-4 py-2.5 bg-brand-navy text-white text-sm font-medium rounded-lg hover:bg-brand-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Reply className="w-4 h-4" />
                    {sending ? 'Sending…' : 'Send Reply'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">Reply will be sent from {vendorEmail} via email</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
