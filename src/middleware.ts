import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type CookieToSet = { name: string; value: string; options?: CookieOptions }

/** Paths that require an authenticated user. */
const PROTECTED_PREFIXES = ['/vendor', '/admin', '/account']

/** Public exceptions inside those sections (e.g. the admin sign-in page). */
const PUBLIC_EXCEPTIONS = ['/admin/login']

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // ── 1. Force HTTPS ────────────────────────────────────────────────
  // Netlify terminates TLS and reports the original scheme here. Anything
  // arriving over plain HTTP is permanently redirected to HTTPS so customers
  // never submit details on an unencrypted connection.
  const proto = request.headers.get('x-forwarded-proto')
  if (proto === 'http' && process.env.NODE_ENV === 'production') {
    const httpsUrl = new URL(request.url)
    httpsUrl.protocol = 'https:'
    return NextResponse.redirect(httpsUrl, 301)
  }

  // ── 2. Auth guards (only for protected sections) ──────────────────
  // Everything else short-circuits here so we don't pay for a Supabase
  // session lookup on every public page view.
  const isProtected =
    PROTECTED_PREFIXES.some((p) => path.startsWith(p)) &&
    !PUBLIC_EXCEPTIONS.some((p) => path.startsWith(p))
  if (!isProtected) return NextResponse.next()

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('next', path)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Run on everything except static assets and image files, so the
     * HTTPS redirect applies site-wide.
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.png|og-image.png|logo.png|logo-white.png|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|txt|xml)$).*)',
  ],
}
