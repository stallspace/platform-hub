import Link from 'next/link'
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-brand-navy text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="text-white font-bold text-xl tracking-tight">MARCRTE</span>
            </div>
            <p className="text-sm leading-relaxed mb-5">
              South Africa&apos;s vetted online marketplace. Connecting trusted vendors with customers since 2026.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-brand-accent transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-brand-accent transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-brand-accent transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Marketplace */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Marketplace</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/marketplace/products"   className="hover:text-white transition-colors">All Products</Link></li>
              <li><Link href="/marketplace/vendors"    className="hover:text-white transition-colors">Vendors</Link></li>
              <li><Link href="/marketplace/categories" className="hover:text-white transition-colors">Categories</Link></li>
              <li><Link href="/marketplace/compare"    className="hover:text-white transition-colors">Compare Products</Link></li>
            </ul>
          </div>

          {/* Vendors */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">For Vendors</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/join"   className="hover:text-white transition-colors">Become a Vendor</Link></li>
              <li><Link href="/join#pricing" className="hover:text-white transition-colors">Pricing Plans</Link></li>
              <li><Link href="/auth/login"    className="hover:text-white transition-colors">Vendor Login</Link></li>
              <li><Link href="/join#faq" className="hover:text-white transition-colors">Vendor FAQ</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 flex-shrink-0 text-brand-accent" />
                <a href="mailto:hello@marcrte.co.za" className="hover:text-white transition-colors">hello@marcrte.co.za</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 flex-shrink-0 text-brand-accent" />
                <span>+27 (0)xx xxx xxxx</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 flex-shrink-0 text-brand-accent mt-0.5" />
                <span>South Africa</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} MARCRTE. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-white transition-colors">POPIA Compliance</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
