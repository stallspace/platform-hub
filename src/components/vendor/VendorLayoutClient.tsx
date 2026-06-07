'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Package, Store, MessageSquare,
  BarChart2, CreditCard, Settings, Crown, LogOut, Bell,
  ShoppingBag, Star, Truck
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  { href: '/vendor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/vendor/products', icon: Package, label: 'Products' },
  { href: '/vendor/storefront', icon: Store, label: 'My Storefront' },
  { href: '/vendor/enquiries', icon: MessageSquare, label: 'Enquiries' },
  { href: '/vendor/orders', icon: ShoppingBag, label: 'Orders' },
  { href: '/vendor/reviews', icon: Star, label: 'Reviews' },
  { href: '/vendor/store-settings', icon: Truck, label: 'Store Settings' },
  { href: '/vendor/analytics', icon: BarChart2, label: 'Analytics' },
  { href: '/vendor/payments', icon: CreditCard, label: 'Payments' },
  { href: '/vendor/subscription', icon: Crown, label: 'Subscription' },
  { href: '/vendor/settings', icon: Settings, label: 'Settings' },
]

interface Props {
  vendor: {
    id: string
    business_name: string
    slug: string
    subscription_plan: string | null
    subscription_status: string | null
    logo_url: string | null
  }
  children: React.ReactNode
}

export default function VendorLayoutClient({ vendor, children }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const initials = vendor.business_name.slice(0, 2).toUpperCase()
  const planLabel = vendor.subscription_plan
    ? vendor.subscription_plan.charAt(0).toUpperCase() + vendor.subscription_plan.slice(1) + ' Plan'
    : 'No Plan'

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-navy flex-shrink-0 flex flex-col">
        <div className="p-5 border-b border-white/10">
          <Link href="/marketplace" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-white font-bold text-lg">MARCRTE</span>
          </Link>
          <p className="text-gray-400 text-xs mt-1 ml-10">Vendor Portal</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-white/20 text-white font-medium'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            {vendor.logo_url ? (
              <img src={vendor.logo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 bg-brand-accent rounded-full flex items-center justify-center text-white text-sm font-bold">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{vendor.business_name}</p>
              <p className="text-gray-400 text-xs">{planLabel}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-3 py-2 text-gray-400 hover:text-white text-sm transition-colors rounded-lg hover:bg-white/10"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div />
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100">
              <Bell className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 bg-brand-navy rounded-full flex items-center justify-center text-white text-sm font-bold">
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
