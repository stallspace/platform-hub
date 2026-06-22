import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy | Stallspace',
  description: 'How Stallspace collects, uses, and protects your personal information.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link href="/marketplace" className="text-sm text-[#2ECC8E] hover:underline mb-8 inline-block">
          ← Back to Marketplace
        </Link>

        <h1 className="text-3xl font-bold text-[#0D3B2E] mb-2">Privacy Policy</h1>
        <p className="text-sm text-[#9CA3AF] mb-10">Last updated: {new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="prose prose-sm max-w-none text-[#374151] space-y-6">
          <p>
            Stallspace ("we", "us", "our") is operated by Kwry (Pty) Ltd, a company registered in South Africa.
            This Privacy Policy explains how we collect, use, store, and protect your personal information when
            you use the Stallspace marketplace platform, in accordance with the Protection of Personal Information
            Act 4 of 2013 ("POPIA").
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">1. Information We Collect</h2>
          <p>We collect personal information that you provide directly to us, including:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Name, email address, and phone number when you create an account or contact a vendor</li>
            <li>Delivery and billing addresses for orders</li>
            <li>Business information submitted by vendors during registration (business name, registration number, banking details for payment configuration)</li>
            <li>Communications between you and vendors via our enquiry system</li>
            <li>Usage data such as pages visited, products viewed, and search queries</li>
          </ul>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Facilitate connections between customers and vendors</li>
            <li>Process and display order history and enquiries</li>
            <li>Verify and approve vendor applications</li>
            <li>Send transactional notifications (order updates, enquiry replies, subscription status)</li>
            <li>Improve and personalise the marketplace experience</li>
            <li>Comply with legal and regulatory obligations</li>
          </ul>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">3. Important: Payments Are Not Processed by Stallspace</h2>
          <p>
            Stallspace is not a payment intermediary. When you make a purchase, your payment is processed
            directly by the vendor's chosen payment provider (PayFast, Peach Payments, Yoco, or Ozow). We do
            not collect, store, or have access to your full payment card details. Please refer to the relevant
            payment provider's privacy policy for information on how they handle your payment data.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">4. Sharing of Information</h2>
          <p>We share personal information only where necessary:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>With the relevant vendor when you submit an enquiry or place an order</li>
            <li>With our service providers (e.g. Supabase for data storage, Resend for email delivery) strictly to operate the platform</li>
            <li>Where required by law or to protect our legal rights</li>
          </ul>
          <p>We do not sell your personal information to third parties.</p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">5. Data Security</h2>
          <p>
            We implement reasonable technical and organisational measures to protect your information, including
            SSL encryption, role-based access control, and database-level security policies. However, no method
            of transmission over the internet is 100% secure.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">6. Your Rights Under POPIA</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Request access to the personal information we hold about you</li>
            <li>Request correction or deletion of your personal information</li>
            <li>Object to the processing of your personal information</li>
            <li>Lodge a complaint with the Information Regulator of South Africa</li>
          </ul>
          <p>
            You can manage or delete your account information directly from your account settings, or contact
            us using the details below.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">7. Data Retention</h2>
          <p>
            We retain personal information for as long as necessary to provide our services and comply with
            legal obligations. Account information is retained until you request deletion or your account is
            closed.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">8. Information Officer & Contact</h2>
          <p>
            Our Information Officer can be reached for any privacy-related queries, access requests, or
            complaints at:
          </p>
          <p>
            Kwry (Pty) Ltd<br />
            Email: <a href="mailto:privacy@stallspace.co.za" className="text-[#2ECC8E] hover:underline">privacy@stallspace.co.za</a><br />
            South Africa
          </p>
          <p>
            You may also lodge a complaint with the Information Regulator of South Africa at{' '}
            <a href="https://inforegulator.org.za" target="_blank" rel="noopener noreferrer" className="text-[#2ECC8E] hover:underline">
              inforegulator.org.za
            </a>.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Material changes will be communicated via
            email or a notice on the platform.
          </p>
        </div>
      </div>
    </div>
  )
}
