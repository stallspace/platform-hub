import Link from 'next/link'
import { Mail, LifeBuoy, Store, ShieldCheck, Instagram } from 'lucide-react'

export const metadata = {
  title: 'Contact Us | Stallspace',
  description: 'How to reach Stallspace — support for shoppers, help for vendors, billing and privacy.',
}

const CHANNELS = [
  {
    icon: LifeBuoy,
    title: 'Problem with an order',
    address: 'support@stallspace.co.za',
    body: 'Order not arrived, a return a vendor will not honour, anything that has gone wrong with a purchase. Include your order number and we can find it straight away.',
  },
  {
    icon: Store,
    title: 'Selling on Stallspace',
    address: 'hello@stallspace.co.za',
    body: 'Questions about joining, what a stall costs, or how getting paid works. Already applied and waiting? Mail us here too.',
  },
  {
    icon: Mail,
    title: 'Billing',
    address: 'billing@stallspace.co.za',
    body: 'Invoices, payment references and anything about your monthly stall fee.',
  },
  {
    icon: ShieldCheck,
    title: 'Privacy and data',
    address: 'privacy@stallspace.co.za',
    body: 'Requests to see, correct or delete your personal information under POPIA.',
  },
]

export default function ContactPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <Link href="/marketplace" className="text-sm text-[#2ECC8E] hover:underline mb-6 sm:mb-8 inline-block">
          ← Back to Marketplace
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold text-[#0D3B2E] mb-2">Contact us</h1>
        <p className="text-[#6B7280] mb-8 sm:mb-10 max-w-xl">
          We are a small South African team and we answer our own email. Pick the address that fits and
          we will come back to you within one business day.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {CHANNELS.map(({ icon: Icon, title, address, body }) => (
            <div key={address} className="border border-[#E5E7EB] rounded-xl p-5">
              <Icon className="w-5 h-5 text-[#2ECC8E] mb-3" />
              <h2 className="font-semibold text-[#0D3B2E] mb-1.5">{title}</h2>
              <p className="text-sm text-[#6B7280] leading-relaxed mb-3">{body}</p>
              <a href={`mailto:${address}`} className="text-sm font-medium text-[#0D3B2E] hover:text-[#2ECC8E] break-all">
                {address}
              </a>
            </div>
          ))}
        </div>

        <div className="mt-8 sm:mt-10 border border-[#E5E7EB] rounded-xl p-5">
          <h2 className="font-semibold text-[#0D3B2E] mb-1.5">Buying from a vendor?</h2>
          <p className="text-sm text-[#6B7280] leading-relaxed">
            Questions about a specific product — sizing, stock, when it ships — are best answered by the
            vendor themselves. Every storefront has a <span className="font-medium">Send an Enquiry</span>{' '}
            form that goes straight to them, and they will usually know more than we do. Come to us if they
            do not reply, or if something has gone wrong with an order.
          </p>
        </div>

        <div className="mt-5 flex items-center gap-2 text-sm text-[#6B7280]">
          <Instagram className="w-4 h-4 text-[#9CA3AF]" />
          <span>
            Also on Instagram —{' '}
            <a
              href="https://www.instagram.com/stallspace_"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0D3B2E] hover:text-[#2ECC8E] font-medium"
            >
              @stallspace_
            </a>
          </span>
        </div>
      </div>
    </div>
  )
}
