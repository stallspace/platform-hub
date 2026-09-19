import Link from 'next/link'
import { COMPANY, companyDisclosureLines } from '@/lib/legal/company'

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
        {/* Pinned, not generated. A policy that always reads "updated today"
            has no audit trail — bump this by hand when the text changes. */}
        <p className="text-sm text-[#9CA3AF] mb-10">Last updated: 19 September 2026</p>

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
            <li>Business information submitted by vendors during registration, including business name, registration number, and the merchant identifiers for the vendor&apos;s own payment gateway such as a PayFast merchant ID and passphrase, which we store encrypted. Stallspace does not collect or hold vendor bank account numbers, and never receives or holds customer funds.</li>
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

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">3. Our Lawful Basis</h2>
          <p>
            Section 11 of POPIA requires a justification for every processing activity. Ours are:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Performance of a contract</strong> (s11(1)(b)) for your order, delivery and contact details, and for giving you the marketplace service you asked for.</li>
            <li><strong>Legal obligation</strong> (s11(1)(c)) for transaction, tax and company records we are required to keep.</li>
            <li><strong>Legitimate interests</strong> (s11(1)(f)) for vendor application and verification data, fraud prevention, and keeping the marketplace vetted.</li>
            <li><strong>Consent</strong> (s11(1)(a)) for any marketing message. You may withdraw that consent at any time and we stop.</li>
          </ul>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">4. Cookies and Similar Technologies</h2>
          <p>
            We set only the cookies the site needs to work. Those are the session cookies that keep you
            signed in, set by our authentication provider. We set <strong>no advertising cookies and no
            third-party tracking cookies</strong>, and we do not sell or share your browsing behaviour with
            anyone.
          </p>
          <p>
            Our own page-visit counter stores a random identifier in your browser&apos;s session storage,
            not in a cookie. It is cleared when you close the tab, it is not linked to your name or email,
            and it exists so we can count visits to the marketplace and to each storefront.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">5. Where Your Information Is Stored</h2>
          <p>
            Our database is hosted by Supabase in <strong>Frankfurt, Germany</strong>, in the European
            Union. Our email is sent by Resend. Transferring your information there is permitted by section
            72 of POPIA, because those providers are bound by the European General Data Protection
            Regulation and by a written processing agreement with us that imposes protections substantially
            similar to POPIA&apos;s eight conditions, and because the transfer is necessary to perform your
            contract with us.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">6. Important: Payments Are Not Processed by Stallspace</h2>
          <p>
            Stallspace is not a payment intermediary. When you make a purchase, your payment is processed
            directly by the vendor's payment provider (currently PayFast). We do
            not collect, store, or have access to your full payment card details. Please refer to the relevant
            payment provider's privacy policy for information on how they handle your payment data.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">7. Sharing of Information</h2>
          <p>We share personal information only where necessary:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>With the relevant vendor when you submit an enquiry or place an order</li>
            <li>With our service providers (e.g. Supabase for data storage, Resend for email delivery) strictly to operate the platform</li>
            <li>Where required by law or to protect our legal rights</li>
          </ul>
          <p>We do not sell your personal information to third parties.</p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">8. Data Security</h2>
          <p>
            We implement reasonable technical and organisational measures to protect your information, including
            SSL encryption, role-based access control, and database-level security policies. However, no method
            of transmission over the internet is 100% secure.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">9. Your Rights Under POPIA</h2>
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

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">10. Data Retention</h2>
          <p>
            Section 14 of POPIA requires us to destroy records once the purpose we collected them for is
            spent. These are the periods we keep to:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Order and transaction records</strong>, five years from the end of the tax year, as tax legislation requires.</li>
            <li><strong>Company and accounting records</strong>, seven years, as the Companies Act requires.</li>
            <li><strong>Customer account details</strong>, until you close the account or ask us to delete them, then 30 days to allow for recovery.</li>
            <li><strong>Vendor application documents for rejected applications</strong>, twelve months.</li>
            <li><strong>Enquiry messages between you and a vendor</strong>, twenty-four months.</li>
            <li><strong>Website usage data</strong>, fourteen months.</li>
          </ul>
          <p>
            We delete or de-identify personal information once these periods expire.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">11. If Your Information Is Compromised</h2>
          <p>
            Where there are reasonable grounds to believe your personal information has been accessed by an
            unauthorised person, we will notify you and the Information Regulator as soon as reasonably
            possible, as section 22 of POPIA requires.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">12. Information Officer &amp; Contact</h2>
          <p>
            Our Information Officer can be reached for any privacy-related queries, access requests, or
            complaints at:
          </p>
          <p>
            {COMPANY.informationOfficer && (
              <>
                {COMPANY.informationOfficer}, as head of {COMPANY.legalName}
                <br />
              </>
            )}
            {companyDisclosureLines().map(line => (
              <span key={line}>
                {line}
                <br />
              </span>
            ))}
            Email:{' '}
            <a href={`mailto:${COMPANY.informationOfficerEmail}`} className="text-[#2ECC8E] hover:underline">
              {COMPANY.informationOfficerEmail}
            </a>{' '}
            or{' '}
            <a href="mailto:privacy@stallspace.co.za" className="text-[#2ECC8E] hover:underline">privacy@stallspace.co.za</a>
          </p>
          <p>
            We respond to an access request within 30 days, as the Promotion of Access to Information Act
            requires.
          </p>
          <p>
            You may also lodge a complaint with the Information Regulator of South Africa at{' '}
            <a href="https://inforegulator.org.za" target="_blank" rel="noopener noreferrer" className="text-[#2ECC8E] hover:underline">
              inforegulator.org.za
            </a>.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">13. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Material changes will be communicated via
            email or a notice on the platform.
          </p>
        </div>
      </div>
    </div>
  )
}
