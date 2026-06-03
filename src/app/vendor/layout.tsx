import Link from 'next/link'
import {
  LayoutDashboard, Package, Store, MessageSquare,
  BarChart2, CreditCard, Settings, Crown, LogOut,
  Bell
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/vendor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/vendor/products', icon: Package, label: 'Products' },
  { href: '/vendor/storefront', icon: Store, label: 'My Storefront' },
  { href: '/vendor/enquiries', icon: MessageSquare, label: 'Enquiries', badge: 3 },
  { href: '/vendor/analytics', icon: BarChart2, label: 'Analytics' },
  { href: '/vendor/payments', icon: CreditCard, label: 'Payments' },
  { href: '/vendor/subscription', icon: Crown, label: 'Subscription' },
  { href: '/vendor/settings', icon: Settings, label: 'Settings' },
]

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-navy flex-shrink-0 flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-white/10">
          <Link href="/marketplace" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-white font-bold text-lg">MARCRTE</span>
          </Link>
          <p className="text-gray-400 text-xs mt-1 ml-10">Vendor Portal</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-colors group text-sm"
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 bg-brand-accent rounded-full flex items-center justify-center text-white text-sm font-bold">
              V
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">Vendor Name</p>
              <p className="text-gray-400 text-xs">Growth Plan</p>
            </div>
          </div>
          <button className="flex items-center gap-2 w-full px-3 py-2 text-gray-400 hover:text-white text-sm transition-colors">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div />
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="w-8 h-8 bg-brand-navy rounded-full flex items-center justify-center text-white text-sm font-bold">
              V
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
