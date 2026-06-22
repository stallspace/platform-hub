'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Package, Store, MessageSquare, BarChart2, CreditCard,
  Settings, Crown, LogOut, ShoppingBag, Star, Truck, Menu, X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import VendorNotificationsBell from '@/components/vendor/VendorNotificationsBell'

const NAV_ITEMS = [
  { href: '/vendor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/vendor/products',  icon: Package,         label: 'Products' },
  { href: '/vendor/storefront',icon: Store,           label: 'My Storefront' },
  { href: '/vendor/enquiries', icon: MessageSquare,   label: 'Enquiries' },
  { href: '/vendor/orders',    icon: ShoppingBag,     label: 'Orders' },
  { href: '/vendor/reviews',   icon: Star,            label: 'Reviews' },
  { href: '/vendor/store-settings', icon: Truck,      label: 'Store Settings' },
  { href: '/vendor/analytics', icon: BarChart2,       label: 'Analytics' },
  { href: '/vendor/payments',  icon: CreditCard,      label: 'Payments' },
  { href: '/vendor/subscription', icon: Crown,        label: 'Subscription' },
  { href: '/vendor/settings',  icon: Settings,        label: 'Settings' },
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
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const initials = vendor.business_name.slice(0, 2).toUpperCase()
  const planLabel = vendor.subscription_plan
    ? vendor.subscription_plan.charAt(0).toUpperCase() + vendor.subscription_plan.slice(1) + ' Plan'
    : 'No Plan'

  const SidebarContent = (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <Link href="/marketplace" className="flex items-center gap-2">
          <Image
            src="/logo-white.png"
            alt="Stallspace"
            width={120}
            height={36}
            className="h-9 w-auto object-contain"
            priority
          />
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden text-white/60 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <p className="text-white/40 text-xs px-5 pt-1.5 font-medium uppercase tracking-wider">Vendor Portal</p>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-[#2ECC8E]/20 text-white font-semibold'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-[#2ECC8E]' : ''}`} />
              <span className="flex-1">{item.label}</span>
              {active && <span className="w-1.5 h-1.5 rounded-full bg-[#2ECC8E]" />}
            </Link>
          )
        })}
      </nav>

      {/* Vendor info + sign out */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          {vendor.logo_url ? (
            <img src={vendor.logo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 bg-[#2ECC8E] rounded-full flex items-center justify-center text-[#0D3B2E] text-sm font-bold">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate">{vendor.business_name}</p>
            <p className="text-white/40 text-xs">{planLabel}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full px-3 py-2 text-white/40 hover:text-white text-sm transition-colors rounded-lg hover:bg-white/10"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-[#F8FAF3] flex">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex w-64 bg-[#0D3B2E] flex-shrink-0 flex-col">
        {SidebarContent}
      </aside>

      {/* ── Mobile Sidebar Drawer ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 bg-[#0D3B2E] flex flex-col h-full">
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="bg-white border-b border-[#E5E7EB] px-4 sm:px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden text-[#0D3B2E] p-1"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <VendorNotificationsBell />
            <div className="w-8 h-8 bg-[#0D3B2E] rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
