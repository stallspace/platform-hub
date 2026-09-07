import Link from 'next/link'

export const metadata = {
  title: 'Returns & Refunds | Stallspace',
  description:
    'How returns, refunds and cancellations work on Stallspace, and the rights South African law gives you when you buy from a vendor.',
}

export default function ReturnsAndRefundsPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link href="/marketplace" className="text-sm text-[#2ECC8E] hover:underline mb-8 inline-block">
          ← Back to Marketplace
        </Link>

        <h1 className="text-3xl font-bold text-[#0D3B2E] mb-2">Returns &amp; Refunds</h1>
        {/* Pinned, not generated. A policy that always reads "updated today"
            has no audit trail — bump this by hand when the text changes. */}
        <p className="text-sm text-[#9CA3AF] mb-10">Last updated: 7 September 2026</p>

        <div className="prose prose-sm max-w-none text-[#374151] space-y-6">
          <div className="bg-[#F8FAF3] border border-[#E5E7EB] rounded-xl p-5 not-prose">
            <p className="text-sm text-[#374151] m-0">
              <strong className="text-[#0D3B2E]">In short:</strong> you buy from the vendor, not from
              Stallspace. Your money goes straight to them and your return is arranged with them. South
              African law gives you a set of rights that no vendor on this marketplace may take away, and
              they are set out below. If a vendor will not honour them, tell us.
            </p>
          </div>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">1. Who you are buying from</h2>
          <p>
            Stallspace is a marketplace. Each storefront is an independent business that sets its own
            prices, holds its own stock and is the seller of record for everything it lists. Payment goes
            directly from you to that vendor — Stallspace never receives or holds your money, and never
            stores your card details.
          </p>
          <p>
            One consequence matters for refunds: <strong>Stallspace cannot issue a refund on a vendor&apos;s
            behalf</strong>, because we never received the payment. A refund is always made by the vendor,
            back to the method you paid with.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">2. Your right to change your mind</h2>
          <p>
            Because you are buying online, section 44 of the Electronic Communications and Transactions Act
            gives you <strong>seven days from delivery to cancel for any reason at all</strong>, without
            penalty and without giving a reason. You return the goods; the vendor refunds you within 30 days
            of the cancellation.
          </p>
          <p>
            You pay the cost of sending the goods back, and the goods must be returned in the condition you
            received them. Some categories are excluded by law from this right — including goods made or
            personalised to your specification, perishable goods, and items unsealed after delivery where
            that affects hygiene or is otherwise irreversible. A vendor must tell you clearly on the product
            page when an item is excluded.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">3. If something is faulty</h2>
          <p>
            Separately, and for longer, section 56 of the Consumer Protection Act gives you{' '}
            <strong>six months from delivery</strong> to return goods that are defective, unsafe, not
            durable, or not fit for the purpose they are ordinarily used for. You may ask for a repair, a
            replacement or a refund, and the choice is yours, not the vendor&apos;s.
          </p>
          <p>
            The vendor bears the cost of that return. This right cannot be signed away by a general
            disclaimer — though a vendor may point out a specific defect before you buy (for example, a
            second-hand item sold as marked), and you cannot then claim for that particular defect.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">4. If it is not what was described</h2>
          <p>
            If goods do not match their description, sample or the specification you ordered, you may refuse
            delivery or return them, and the vendor carries the cost of doing so.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">5. How to start a return</h2>
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>Find your order number in the confirmation email we sent when you ordered.</li>
            <li>
              Contact the vendor — every storefront has a{' '}
              <span className="font-medium">Send an Enquiry</span> form, and most publish an email address
              and phone number.
            </li>
            <li>Tell them your order number, what you are returning, and why.</li>
            <li>Agree how the goods get back to them before you send anything.</li>
          </ol>
          <p>
            Vendors are required to respond to a return request within{' '}
            <strong>five business days</strong>.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">6. Orders paid on collection</h2>
          <p>
            Some vendors let you place an order and pay when you collect it. Until you have paid and taken
            the goods, you may cancel at any time at no cost — there is nothing to refund. Once you have
            collected and paid, the rights in sections 2 to 4 above apply as normal.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">7. If a vendor will not co-operate</h2>
          <p>
            Email us at{' '}
            <a href="mailto:support@stallspace.co.za" className="text-[#2ECC8E] hover:underline">
              support@stallspace.co.za
            </a>{' '}
            with your order number and what has happened. We cannot refund you ourselves, but we can take it
            up with the vendor, and persistent failure to honour these rights is grounds for us removing a
            vendor from the marketplace.
          </p>
          <p>
            You may also take a complaint to the National Consumer Commission, or to a recognised consumer
            goods ombud, independently of us.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">8. What vendors agree to</h2>
          <p>
            Every vendor accepted onto Stallspace agrees to honour the rights above as a minimum. A vendor
            may offer a more generous policy — a longer exchange window, free return shipping — and many do.
            None may offer less.
          </p>

          <p className="text-xs text-[#9CA3AF] pt-6 border-t border-[#E5E7EB]">
            This page summarises rights given by the Consumer Protection Act 68 of 2008 and the Electronic
            Communications and Transactions Act 25 of 2002. It is a plain-language summary, not legal advice,
            and the Acts themselves prevail where this page is unclear or incomplete.
          </p>
        </div>
      </div>
    </div>
  )
}
