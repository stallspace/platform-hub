'use client'

import { useState } from 'react'
import { Star, Send, CheckCircle } from 'lucide-react'

interface Props {
  vendorId: string
  productId?: string
  productName?: string
}

export default function ReviewForm({ vendorId, productId, productName }: Props) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [name, setName] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!rating) { setError('Please select a star rating'); return }
    if (!name.trim()) { setError('Please enter your name'); return }
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendor_id: vendorId, product_id: productId ?? null, customer_name: name.trim(), rating, comment: comment.trim() || null }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to submit')
      setSubmitted(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
        <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
        <h3 className="font-semibold text-green-800 text-lg">Review submitted!</h3>
        <p className="text-green-700 text-sm mt-1">Your review is pending approval and will appear shortly.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-1">Leave a Review</h3>
      <p className="text-sm text-gray-500 mb-5">
        {productName ? `Reviewing: ${productName}` : 'Share your experience with this vendor'}
      </p>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Your Rating</label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setRating(s)}
                onMouseEnter={() => setHovered(s)}
                onMouseLeave={() => setHovered(0)}
                className="transition-transform hover:scale-110"
              >
                <Star className={"w-8 h-8 transition-colors " + (s <= (hovered || rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200')} />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-sm font-medium text-gray-600">
                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Your Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. John Smith"
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-mint/30 focus:border-brand-mint"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Comment <span className="text-gray-400 font-normal">(optional)</span></label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Tell others about your experience..."
            rows={3}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-mint/30 focus:border-brand-mint resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-2.5 bg-brand-forest text-white text-sm font-semibold rounded-xl hover:bg-brand-mint transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </div>
  )
}
