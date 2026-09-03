'use client'

/**
 * Last-resort boundary — catches errors thrown in the root layout itself,
 * where the normal error.tsx cannot render. Must supply its own <html> and
 * <body>, and cannot rely on the app's providers or fonts loading.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en-ZA">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', background: '#F8FAF3' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 16px',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: 420 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0D3B2E', marginBottom: 12 }}>
              Stallspace is temporarily unavailable
            </h1>
            <p style={{ color: '#6B7280', fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>
              We hit an unexpected problem loading the site. Please try again in a moment.
            </p>
            <button
              onClick={reset}
              style={{
                background: '#0D3B2E',
                color: '#fff',
                border: 0,
                borderRadius: 8,
                padding: '12px 24px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            {error.digest && (
              <p style={{ marginTop: 28, fontSize: 12, color: '#9CA3AF' }}>Reference: {error.digest}</p>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}
