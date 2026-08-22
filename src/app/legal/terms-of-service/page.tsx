import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service | Stallspace',
  description: 'The terms and conditions governing your use of the Stallspace marketplace.',
}

export default function TermsOfServicePage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link href="/marketplace" className="text-sm text-[#2ECC8E] hover:underline mb-8 inline-block">
          ← Back to Marketplace
        </Link>

        <h1 className="text-3xl font-bold text-[#0D3B2E] mb-2">Terms of Service</h1>
        <p className="text-sm text-[#9CA3AF] mb-10">Last updated: {new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="prose prose-sm max-w-none text-[#374151] space-y-6">
          <p>
            These Terms of Service ("Terms") govern your access to and use of Stallspace, a marketplace
            platform operated by Kwry (Pty) Ltd ("Stallspace", "we", "us"). By accessing or using the platform,
            you agree to be bound by these Terms.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">1. What Stallspace Is</h2>
          <p>
            Stallspace is a vetted online marketplace that enables independent vendors to create storefronts
            and sell products directly to customers. Stallspace is not a party to any transaction between a
            customer and a vendor.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">2. Stallspace Is Not a Payment Intermediary</h2>
          <p>
            All customer payments are made directly to the vendor via the vendor's own configured payment
            gateway (currently PayFast), or in person where the vendor offers payment on collection.
            Stallspace does not collect, hold, process, or
            distribute customer funds at any point. Stallspace records transactions for reporting and platform
            functionality purposes only.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">3. Customer Accounts</h2>
          <p>
            Customers may browse and purchase as a guest without creating an account. Optional accounts may be
            created to save favourites, addresses, and view order history. You are responsible for maintaining
            the confidentiality of your account credentials.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">4. Vendor Registration and Approval</h2>
          <p>
            Vendors must submit a complete application including business details and supporting documentation.
            Stallspace reserves the right to approve, reject, or suspend any vendor application at its sole
            discretion to maintain marketplace quality and trust.
          </p>
          <p>
            Approved vendors must maintain an active monthly subscription to remain listed on the platform.
            Accounts with failed or lapsed payments may be automatically suspended and reactivated upon
            successful payment, in accordance with our billing terms.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">5. Vendor Responsibilities</h2>
          <p>Vendors are solely responsible for:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>The accuracy of product listings, pricing, and stock availability</li>
            <li>Registering and maintaining their own payment gateway merchant accounts</li>
            <li>Compliance with all applicable consumer protection, tax, and trading laws</li>
            <li>Fulfilling orders, handling returns, and resolving customer disputes</li>
            <li>The security and settlement of funds received via their chosen payment provider</li>
          </ul>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">6. Subscription Billing</h2>
          <p>
            Vendor subscriptions are billed monthly in advance and renew automatically until cancelled. Pricing
            for each plan is displayed at the time of registration and may be updated with reasonable notice.
            No commission is charged on individual sales.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">7. Prohibited Conduct</h2>
          <p>You may not use Stallspace to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>List counterfeit, illegal, or prohibited goods</li>
            <li>Misrepresent product information or vendor identity</li>
            <li>Circumvent or interfere with the platform's security or functionality</li>
            <li>Harass, defraud, or mislead other users</li>
          </ul>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">8. Limitation of Liability</h2>
          <p>
            Stallspace provides the platform on an "as is" basis. To the maximum extent permitted by law,
            Stallspace shall not be liable for any indirect, incidental, or consequential damages arising from
            your use of the platform, transactions with vendors, or reliance on vendor-provided information.
            Stallspace is not liable for disputes, payment failures, or product issues arising between
            customers and vendors, as these transactions occur directly between the two parties.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">9. Termination</h2>
          <p>
            We may suspend or terminate your access to Stallspace at our discretion if you breach these Terms
            or engage in conduct that harms the platform or its users.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">10. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the Republic of South Africa. Any disputes shall be
            subject to the exclusive jurisdiction of the South African courts.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">11. Contact</h2>
          <p>
            Kwry (Pty) Ltd<br />
            Email: <a href="mailto:hello@stallspace.co.za" className="text-[#2ECC8E] hover:underline">hello@stallspace.co.za</a><br />
            South Africa
          </p>
        </div>
      </div>
    </div>
  )
}
