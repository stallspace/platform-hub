import Link from 'next/link'
import Image from 'next/image'
import { Search, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8FAF3] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <Link href="/marketplace" className="inline-block mb-8">
          <Image
            src="/logo.png"
            alt="Stallspace"
            width={55}
            height={40}
            className="h-10 w-auto object-contain mx-auto"
          />
        </Link>

        <div className="text-[120px] font-bold text-[#0D3B2E] leading-none mb-2">404</div>
        <h1 className="text-2xl font-bold text-[#0D3B2E] mb-3">Page not found</h1>
        <p className="text-[#6B7280] mb-8">
          The page you're looking for doesn't exist or may have moved. Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/marketplace"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0D3B2E] hover:bg-[#081f18] text-white text-sm font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Marketplace
          </Link>
          <Link
            href="/marketplace/products"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-[#F8FAF3] text-[#0D3B2E] text-sm font-semibold px-6 py-3 rounded-lg border border-[#E5E7EB] transition-colors"
          >
            <Search className="w-4 h-4" />
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  )
}
