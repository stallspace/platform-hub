import Link from 'next/link'
import Image from 'next/image'
import { Mail, MapPin, Facebook, Instagram, Twitter } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-[#0D3B2E] text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14">
        {/* Link columns sit side-by-side on mobile so the footer doesn't
            take over the whole screen in the installed app. */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8 sm:gap-10">

          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <div className="mb-3 sm:mb-4">
              <Image
                src="/logo-white.png"
                alt="Stallspace"
                width={55}
                height={40}
                className="h-8 sm:h-10 w-auto object-contain"
              />
            </div>
            <p className="text-xs sm:text-sm leading-relaxed mb-4 sm:mb-5 max-w-sm">
              The vetted online marketplace. Connecting trusted vendors with customers since 2026.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-[#2ECC8E] transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-[#2ECC8E] transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-[#2ECC8E] transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Marketplace */}
          <div>
            <h4 className="text-white font-semibold mb-3 sm:mb-4 text-xs sm:text-sm uppercase tracking-wider">Marketplace</h4>
            <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm">
              <li><Link href="/marketplace/products"   className="hover:text-white transition-colors">All Products</Link></li>
              <li><Link href="/marketplace/vendors"    className="hover:text-white transition-colors">Vendors</Link></li>
              <li><Link href="/marketplace/categories" className="hover:text-white transition-colors">Categories</Link></li>
              <li><Link href="/marketplace/compare"    className="hover:text-white transition-colors">Compare Products</Link></li>
            </ul>
          </div>

          {/* Vendors */}
          <div>
            <h4 className="text-white font-semibold mb-3 sm:mb-4 text-xs sm:text-sm uppercase tracking-wider">For Vendors</h4>
            <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm">
              <li><Link href="/join"             className="hover:text-white transition-colors">Become a Vendor</Link></li>
              <li><Link href="/join#pricing"     className="hover:text-white transition-colors">Pricing Plans</Link></li>
              <li><Link href="/auth/login"       className="hover:text-white transition-colors">Vendor Login</Link></li>
              <li><Link href="/join#faq"         className="hover:text-white transition-colors">Vendor FAQ</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-3 sm:mb-4 text-xs sm:text-sm uppercase tracking-wider">Contact</h4>
            <ul className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm">
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 flex-shrink-0 text-[#2ECC8E]" />
                <a href="mailto:hello@stallspace.co.za" className="hover:text-white transition-colors">hello@stallspace.co.za</a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 flex-shrink-0 text-[#2ECC8E] mt-0.5" />
                <span>South Africa</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 sm:mt-12 pt-5 sm:pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} Stallspace. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/legal/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/legal/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/legal/popia" className="hover:text-white transition-colors">POPIA Compliance</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
