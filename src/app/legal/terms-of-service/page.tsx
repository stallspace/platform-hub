import Link from 'next/link'
import { COMPANY, companyDisclosureLines } from '@/lib/legal/company'

export const metadata = {
  title: 'Terms of Service | Stallspace',
  description:
    'The terms and conditions governing your use of the Stallspace marketplace, including pricing, payment, refunds, cancellations and delivery.',
}

export default function TermsOfServicePage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link href="/marketplace" className="text-sm text-[#2ECC8E] hover:underline mb-8 inline-block">
          ← Back to Marketplace
        </Link>

        <h1 className="text-3xl font-bold text-[#0D3B2E] mb-2">Terms of Service</h1>
        {/* Pinned, not generated. A policy that always reads "updated today"
            has no audit trail — bump this by hand when the text changes. */}
        <p className="text-sm text-[#9CA3AF] mb-10">Last updated: 19 September 2026</p>

        <div className="prose prose-sm max-w-none text-[#374151] space-y-6">
          <p>
            These Terms of Service ("Terms") govern your access to and use of Stallspace, a marketplace
            platform operated by {COMPANY.legalName} ("Stallspace", "we", "us"). By accessing or using the
            platform, you agree to be bound by these Terms.
          </p>

          <div className="bg-[#F8FAF3] border border-[#E5E7EB] rounded-xl p-5 not-prose">
            <p className="text-sm text-[#374151] m-0">
              <strong className="text-[#0D3B2E]">Buying something?</strong> The terms that affect you most
              are sections 6 to 8. Refunds and cancellations are set out in full in our{' '}
              <Link href="/legal/returns-and-refunds" className="text-[#2ECC8E] hover:underline">
                Returns, Refunds &amp; Cancellations
              </Link>{' '}
              policy, and delivery in our{' '}
              <Link href="/legal/delivery" className="text-[#2ECC8E] hover:underline">
                Delivery Policy
              </Link>
              . Both form part of these Terms.
            </p>
          </div>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">1. What Stallspace Is</h2>
          <p>
            Stallspace is a vetted online marketplace that enables independent vendors to create storefronts
            and sell products directly to customers. Stallspace is not a party to any transaction between a
            customer and a vendor.
          </p>
          <p>
            Stallspace sends order confirmations, status updates and receipts as the vendor&apos;s agent, for
            the vendor&apos;s convenience. Doing so does not make Stallspace a party to the sale, and
            Stallspace receives no part of the price.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">2. Stallspace Is Not a Payment Intermediary</h2>
          <p>
            All customer payments are made directly to the vendor via the vendor&apos;s own configured payment
            gateway (currently PayFast), or in person where the vendor offers payment on collection.
            Stallspace does not collect, hold, process, or distribute customer funds at any point, and never
            stores card details. Card data is entered on the payment gateway&apos;s own PCI DSS compliant
            pages and is never transmitted to or held by Stallspace. Stallspace records transactions for
            reporting and platform functionality purposes only.
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
            <li>Registering and maintaining their own payment gateway merchant accounts, and complying with that gateway&apos;s merchant rules and the card scheme rules behind them</li>
            <li>Publishing their delivery areas, delivery cost and delivery timeframe on their storefront, and honouring them</li>
            <li>Publishing on their storefront the name they trade under, a street address, a telephone number and an email address, and their company or close corporation registration number where they are a registered business, as section 43 of the Electronic Communications and Transactions Act requires of every online supplier</li>
            <li>Honouring the marketplace Returns, Refunds &amp; Cancellations policy and Delivery Policy as a minimum standard</li>
            <li>Compliance with all applicable consumer protection, tax, and trading laws</li>
            <li>Fulfilling orders, handling returns, issuing refunds, and resolving customer disputes</li>
            <li>The security and settlement of funds received via their chosen payment provider</li>
            <li>Responding to a customer enquiry, return request or delivery query within five business days</li>
          </ul>
          <p>
            A vendor who does not meet these obligations may be suspended or removed from the marketplace.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">6. Prices, Payment and Currency</h2>
          <p>
            Every price on Stallspace is quoted in South African Rand ({COMPANY.currency}) and includes VAT
            where the vendor is VAT registered. The vendor sets the price, and it is the price you pay.
          </p>
          <p>
            Delivery is charged separately where the vendor charges for it. The delivery fee appears on the
            vendor&apos;s storefront, on the product page, and again as its own line on the checkout summary
            before you are sent to the payment page. Your order total is the sum of those lines and nothing
            else. Stallspace adds no fee, commission or surcharge to a customer order.
          </p>
          <p>
            Payment is taken by the vendor&apos;s payment gateway and supports South African debit and credit
            cards and instant EFT. Where a vendor offers payment on collection, no online payment is taken and
            you pay the vendor directly when you collect.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">7. Returns, Refunds, Cancellations and Delivery</h2>
          <p>
            Our{' '}
            <Link href="/legal/returns-and-refunds" className="text-[#2ECC8E] hover:underline">
              Returns, Refunds &amp; Cancellations
            </Link>{' '}
            policy and our{' '}
            <Link href="/legal/delivery" className="text-[#2ECC8E] hover:underline">
              Delivery Policy
            </Link>{' '}
            are incorporated into these Terms and are binding on every vendor and customer on the platform.
            In summary:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>You may cancel an order at no cost at any time before the vendor dispatches it, and receive a full refund of anything already paid, delivery fee included.</li>
            <li>Section 44 of the Electronic Communications and Transactions Act gives you seven days from delivery to cancel an online purchase for any reason and return the goods.</li>
            <li>Section 56 of the Consumer Protection Act gives you six months from delivery to return goods that are defective, unsafe or not fit for purpose, and to choose a repair, a replacement or a refund.</li>
            <li>Where a vendor publishes no delivery timeframe, section 46 of the Electronic Communications and Transactions Act requires delivery within 30 days, failing which you may cancel on seven days&apos; notice and take a full refund.</li>
            <li>Refunds are made by the vendor to the payment method used, normally within five to ten business days of the vendor processing them and in no case later than 30 days from the cancellation.</li>
          </ul>
          <p>
            Because Stallspace never receives customer funds, a refund is always paid out of the
            vendor&apos;s own account and is always the vendor&apos;s decision. Where the vendor uses
            PayFast, the vendor can instruct that refund from their Stallspace dashboard and Stallspace
            passes the instruction to PayFast using the vendor&apos;s own merchant credentials. Stallspace
            cannot decide to refund a customer and cannot refund one if the vendor will not. Stallspace will
            take the matter up with a vendor who refuses to honour these rights, and persistent refusal is
            grounds for removal from the marketplace, but Stallspace does not guarantee an outcome and is
            not liable for a vendor&apos;s failure.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">8. Subscription Billing</h2>
          <p>
            Vendor subscriptions are billed monthly in advance and renew automatically until cancelled. Pricing
            for each plan is displayed at the time of registration and may be updated with reasonable notice.
            No commission is charged on individual sales. The minimum term is one month. There is no lock-in
            and no fixed term, and a vendor may cancel at any time, effective at the end of the paid month.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">9. Prohibited Conduct</h2>
          <p>You may not use Stallspace to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>List counterfeit, illegal, or prohibited goods</li>
            <li>Misrepresent product information or vendor identity</li>
            <li>Circumvent or interfere with the platform&apos;s security or functionality</li>
            <li>Harass, defraud, or mislead other users</li>
            <li>Process a payment on behalf of another business, or accept payment for goods sold anywhere other than through your own storefront</li>
          </ul>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">10. Prohibited and Restricted Goods</h2>
          <p>
            Card scheme and acquiring bank rules bind every vendor who accepts card payment. The following may
            not be listed or sold on Stallspace, and a listing in any of these categories is removed on sight:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Weapons, ammunition, explosives and their components</li>
            <li>Illegal drugs, drug paraphernalia, and unregistered or unscheduled medicines</li>
            <li>Tobacco, vaping products and alcohol, unless the vendor holds the required licence and has told us</li>
            <li>Adult or sexually explicit goods and services</li>
            <li>Counterfeit, replica or stolen goods, and anything infringing a trade mark or copyright</li>
            <li>Live animals, endangered species and products made from them</li>
            <li>Financial instruments, cryptocurrency, gift cards resold at a markup, gambling and lottery products</li>
            <li>Personal data, credentials, account access and hacking tools</li>
            <li>Human remains, body parts and bodily fluids</li>
            <li>Goods requiring a licence the vendor does not hold, and anything otherwise unlawful to sell in South Africa</li>
          </ul>
          <p>
            Listing prohibited goods is grounds for immediate removal from the marketplace, and may cause the
            vendor&apos;s payment gateway to terminate their merchant account independently of us.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">11. Limitation of Liability</h2>
          <p>
            <strong>Nothing in this section limits or excludes any liability that cannot be limited or
            excluded in law. That includes liability for death or personal injury, for fraud, for gross
            negligence under section 51(1)(c) of the Consumer Protection Act, and any right you have under
            the Consumer Protection Act 68 of 2008, the Electronic Communications and Transactions Act 25 of
            2002 or POPIA.</strong>
          </p>
          <p>
            Subject to that, Stallspace provides the platform with reasonable skill and care but does not
            warrant that it will be uninterrupted or error free. To the maximum extent permitted by law,
            Stallspace is not liable for any indirect, incidental or consequential damages arising from your
            use of the platform, transactions with vendors, or reliance on vendor-provided information.
            Stallspace is not a party to the contract of sale between a customer and a vendor and is not
            liable for a vendor&apos;s goods, delivery, refunds or conduct.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">12. Termination</h2>
          <p>
            We may suspend or terminate your access to Stallspace at our discretion if you breach these Terms
            or engage in conduct that harms the platform or its users.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">13. Governing Law and Disputes</h2>
          <p>
            These Terms are governed by the laws of the Republic of South Africa. Any disputes shall be
            subject to the exclusive jurisdiction of the South African courts.
          </p>
          <p>
            Before going to court, please raise the matter with us at{' '}
            <a href={`mailto:${COMPANY.supportEmail}`} className="text-[#2ECC8E] hover:underline">
              {COMPANY.supportEmail}
            </a>
            . A customer may also refer a complaint to the National Consumer Commission or a recognised
            consumer goods ombud at any time, independently of us.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">14. Codes of Conduct and Dispute Resolution</h2>
          <p>
            You may refer a complaint about any vendor on this marketplace, or about Stallspace, to the{' '}
            <a href="https://www.cgso.org.za" target="_blank" rel="noopener noreferrer" className="text-[#2ECC8E] hover:underline">
              Consumer Goods and Services Ombud
            </a>{' '}
            free of charge, on 0860 000 272 or at complaints@cgso.org.za, or to the National Consumer
            Commission. Both are independent of us and neither costs you anything.
          </p>
          <p>
            Beyond those, Stallspace subscribes to no other self-regulatory body, accreditation body,
            industry code of conduct or alternative dispute resolution code. This statement is published
            because section 43 of the Electronic Communications and Transactions Act requires an online
            supplier to disclose it either way.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">15. Supplier Information</h2>
          <p>
            Published in terms of section 43 of the Electronic Communications and Transactions Act 25 of 2002.
          </p>
          <p>
            {companyDisclosureLines().map(line => (
              <span key={line}>
                {line}
                <br />
              </span>
            ))}
            <a href={COMPANY.website} className="text-[#2ECC8E] hover:underline">{COMPANY.website}</a>
          </p>
          <p>
            Each vendor is a separate supplier and is required by section 5 above to publish its own
            trading name, street address, telephone number and email address on its storefront. Not every
            vendor is a registered company. Some trade as individuals, which is lawful, and they publish
            their own name and address in place of a company name and registration number. Either way, the
            vendor named on your order, not Stallspace, is the supplier of the goods you bought. If a
            storefront does not show those details, tell us and we will require the vendor to publish
            them.
          </p>
        </div>
      </div>
    </div>
  )
}
