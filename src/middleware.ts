import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
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

  const path = request.nextUrl.pathname

  // Protect vendor routes
  if (path.startsWith('/vendor/dashboard') ||
      path.startsWith('/vendor/products') ||
      path.startsWith('/vendor/storefront') ||
      path.startsWith('/vendor/enquiries') ||
      path.startsWith('/vendor/analytics') ||
      path.startsWith('/vendor/payments') ||
      path.startsWith('/vendor/subscription') ||
      path.startsWith('/vendor/settings')) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  // Protect admin routes
  if (path.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    // Additional role check handled in admin layout
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/vendor/:path*',
    '/admin/:path*',
  ],
}
