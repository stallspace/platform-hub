'use client'

import { useState } from 'react'
import { MessageSquare, X } from 'lucide-react'
import EnquiryForm from './EnquiryForm'

interface Props {
  vendorId: string
  vendorEmail: string
  productId: string
  productName: string
}

export default function ProductEnquiryToggle({ vendorId, vendorEmail, productId, productName }: Props) {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-[#0D3B2E] border border-[#E5E7EB] hover:border-[#2ECC8E] hover:bg-[#F8FAF3] transition-colors px-3 py-2 rounded-lg"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        Enquire about this product
      </button>
    )
  }

  return (
    <div className="border-t border-gray-100 pt-3 relative">
      <button
        onClick={() => setOpen(false)}
        className="absolute -top-1 right-0 text-gray-400 hover:text-gray-600"
      >
        <X className="w-4 h-4" />
      </button>
      <EnquiryForm
        vendorId={vendorId}
        vendorEmail={vendorEmail}
        productId={productId}
        productName={productName}
      />
    </div>
  )
}
