import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Navbar from '@/components/marketplace/Navbar'
import Footer from '@/components/marketplace/Footer'
import {
  User, Package, Heart, MapPin, ChevronRight, LogOut
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/account',            label: 'My Profile',   icon: <User    className="w-4 h-4" /> },
  { href: '/account/orders',     label: 'My Orders',    icon: <Package className="w-4 h-4" /> },
  { href: '/account/favourites', label: 'Favourites',   icon: <Heart   className="w-4 h-4" /> },
  { href: '/account/addresses',  label: 'Addresses',    icon: <MapPin  className="w-4 h-4" /> },
]

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?next=/account')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, avatar_url')
    .eq('id', user.id)
    .single()

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email?.slice(0, 2).toUpperCase() ?? 'ME'

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-6">

            {/* Sidebar */}
            <aside className="w-full lg:w-64 flex-shrink-0">
              {/* Profile summary */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-brand-forest flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">{initials}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {profile?.full_name ?? 'My Account'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* Nav */}
              <nav className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {NAV_ITEMS.map((item, i) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-4 py-3.5 text-sm font-medium
                                text-gray-700 hover:bg-gray-50 hover:text-brand-mint transition-colors
                                ${i < NAV_ITEMS.length - 1 ? 'border-b border-gray-50' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">{item.icon}</span>
                      {item.label}
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                  </Link>
                ))}

                {/* Sign out */}
                <form action="/api/auth/signout" method="POST">
                  <button
                    type="submit"
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium
                               text-red-500 hover:bg-red-50 transition-colors border-t border-gray-100"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </form>
              </nav>
            </aside>

            {/* Page content */}
            <div className="flex-1 min-w-0">
              {children}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
