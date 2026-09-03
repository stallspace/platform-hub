'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { RefreshCw, ArrowLeft } from 'lucide-react'

/**
 * Route-level error boundary. Without this, any thrown error in a server
 * component — a Supabase timeout, a bad slug — showed Next.js's unstyled
 * "Application error" screen with no branding and no way back.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app error]', error)
  }, [error])

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

        <h1 className="text-2xl font-bold text-[#0D3B2E] mb-3">Something went wrong on our side</h1>
        <p className="text-[#6B7280] mb-8">
          This one is us, not you. Try again in a moment — if it keeps happening, email us at{' '}
          <a href="mailto:hello@stallspace.co.za" className="text-[#0D3B2E] font-medium underline">
            hello@stallspace.co.za
          </a>
          .
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0D3B2E] hover:bg-[#081f18] text-white text-sm font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
          <Link
            href="/marketplace"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-[#F8FAF3] text-[#0D3B2E] text-sm font-semibold px-6 py-3 rounded-lg border border-[#E5E7EB] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Marketplace
          </Link>
        </div>

        {error.digest && (
          <p className="mt-8 text-xs text-[#9CA3AF]">Reference: {error.digest}</p>
        )}
      </div>
    </div>
  )
}
