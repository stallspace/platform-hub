'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Star, Package, CheckCircle, XCircle } from 'lucide-react'

interface Review {
  id: string
  customer_name: string
  rating: number
  comment: string | null
  is_approved: boolean
  created_at: string
  product_id: string | null
  products?: { name: string } | null
}

interface Props {
  reviews: Review[]
  vendorId: string
}

export default function ReviewsClient({ reviews: initial, vendorId }: Props) {
  const supabase = createClient()
  const [reviews, setReviews] = useState(initial)
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all')
  const [toast, setToast] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function toggleApproval(id: string, current: boolean) {
    setToggling(id)
    const { error } = await supabase.from('reviews').update({ is_approved: !current }).eq('id', id)
    if (error) { showToast('Failed to update review'); setToggling(null); return }
    setReviews(prev => prev.map(r => r.id === id ? { ...r, is_approved: !current } : r))
    showToast(!current ? 'Review approved' : 'Review hidden')
    setToggling(null)
  }

  const filtered = reviews.filter(r => {
    if (filter === 'approved') return r.is_approved
    if (filter === 'pending') return !r.is_approved
    return true
  })

  const avgRating = reviews.length > 0
    ? reviews.filter(r => r.is_approved).reduce((sum, r) => sum + r.rating, 0) / Math.max(reviews.filter(r => r.is_approved).length, 1)
    : 0

  return (
    <div>
      {toast && <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-sm px-4 py-3 rounded-lg shadow-lg">{toast}</div>}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="text-gray-500 text-sm mt-0.5">{reviews.length} total · {avgRating.toFixed(1)} avg rating</p>
        </div>
        <div className="flex gap-2">
          {(['all', 'approved', 'pending'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={"px-3 py-1.5 text-sm rounded-lg font-medium transition-colors " + (filter === f ? 'bg-brand-forest text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300')}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center text-gray-400">
          <Star className="w-10 h-10 opacity-30 mx-auto mb-3" />
          <p className="text-sm">No reviews yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(review => (
            <div
              key={review.id}
              onClick={() => toggleApproval(review.id, review.is_approved)}
              className={"bg-white rounded-xl border p-5 cursor-pointer transition-all hover:shadow-md select-none " + (review.is_approved ? 'border-gray-100 hover:border-green-200' : 'border-amber-100 bg-amber-50/30 hover:border-amber-300') + (toggling === review.id ? ' opacity-60' : '')}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-forest flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {review.customer_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{review.customer_name}</p>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={"w-3 h-3 " + (s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200')} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className={"flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-medium pointer-events-none " + (review.is_approved ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700')}>
                  {review.is_approved ? <><CheckCircle className="w-3.5 h-3.5" /> Approved</> : <><XCircle className="w-3.5 h-3.5" /> Pending</>}
                </div>
              </div>
              {review.products && (
                <div className="flex items-center gap-1 text-xs text-brand-mint mb-2">
                  <Package className="w-3 h-3" />
                  {review.products.name}
                </div>
              )}
              {review.comment && <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>}
              <p className="text-xs text-gray-400 mt-3">{new Date(review.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="text-xs text-gray-400 mt-1">{review.is_approved ? 'Click to hide' : 'Click to approve'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
