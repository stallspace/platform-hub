import Link from 'next/link'

export const metadata = {
  title: 'Returns, Refunds & Cancellations | Stallspace',
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

        <h1 className="text-3xl font-bold text-[#0D3B2E] mb-2">Returns, Refunds &amp; Cancellations</h1>
        {/* Pinned, not generated. A policy that always reads "updated today"
            has no audit trail — bump this by hand when the text changes. */}
        <p className="text-sm text-[#9CA3AF] mb-10">Last updated: 19 September 2026</p>

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
            One consequence matters for refunds. Stallspace never received your money, so a refund is always
            paid out of the vendor&apos;s own account and is always the vendor&apos;s decision. Where the
            vendor uses PayFast, they can start that refund from their Stallspace dashboard and we pass the
            instruction to PayFast using the vendor&apos;s own merchant credentials. <strong>Stallspace
            cannot decide to refund you, and cannot refund you if the vendor will not.</strong>
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">2. Cancelling an order</h2>
          <p>
            <strong>Before the vendor has dispatched it.</strong> You may cancel any order at any point
            before it ships, for any reason, at no charge. Contact the vendor through the enquiry form on
            their storefront, or the email address or phone number they publish, and quote your order
            number. If you have already paid, the vendor cancels the order and refunds you in full,
            including the delivery fee. No cancellation or restocking fee may be charged on an order that
            has not been dispatched.
          </p>
          <p>
            <strong>After it has shipped.</strong> An order already on its way cannot be cancelled, but the
            seven-day right in section 3 below lets you return it once it arrives.
          </p>
          <p>
            <strong>If the vendor cancels.</strong> A vendor may cancel your order if the item turns out to
            be out of stock, or if they cannot deliver to your address. They must tell you why, and they must
            refund you in full within 30 days, as section 46 of the Electronic Communications and
            Transactions Act requires. A vendor may also cancel where the listed price contained an obvious
            error that they have since corrected and taken reasonable steps to publicise, which is the
            narrow allowance in section 23(9) of the Consumer Protection Act. A vendor may not cancel simply
            because they would prefer a higher price. You are never left paid-up against an order that will
            not be filled.
          </p>
          <p>
            <strong>If delivery runs late.</strong> A vendor must deliver within the timeframe published on
            their storefront, or, where they publish none, within 30 days of your order. If they miss the 30
            days, section 46 of the Electronic Communications and Transactions Act lets you cancel with
            seven days&apos; written notice and take a full refund. If they miss their own shorter published
            window, you may require delivery at the agreed time, accept a later date, or cancel without
            penalty where the timing mattered, under section 19 of the Consumer Protection Act. Our{' '}
            <Link href="/legal/delivery" className="text-[#2ECC8E] hover:underline">
              Delivery Policy
            </Link>{' '}
            sets out the timeframes.
          </p>
          <p>
            <strong>How long a refund takes.</strong> Vendors refund to the method you paid with. Where a
            vendor collected payment by card through their payment gateway, the refund is returned the same
            way and normally reflects within <strong>five to ten business days</strong> once the vendor has
            processed it, depending on your bank. Every vendor on Stallspace must start a refund within five
            business days of agreeing to it. Where you cancelled under the seven-day online cooling-off
            right, section 44(3) of the Electronic Communications and Transactions Act gives the vendor 30
            days from the cancellation as the outside limit. Where you returned goods under the Consumer
            Protection Act, or cancelled before dispatch, the Act requires the refund within a reasonable
            time and our five-business-day rule applies.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">3. Your right to change your mind</h2>
          <p>
            Because you are buying online, section 44 of the Electronic Communications and Transactions Act
            gives you <strong>seven days from delivery to cancel for any reason at all</strong>, without
            penalty and without giving a reason. You return the goods; the vendor refunds you within 30 days
            of the cancellation.
          </p>
          <p>
            You pay the cost of sending the goods back, and the goods must be returned in the condition you
            received them. Section 42(2) of the Act excludes some transactions from this right. The ones most
            likely to come up on Stallspace are goods made to your specification or clearly personalised,
            goods that by their nature cannot be returned or that deteriorate or expire quickly, food and
            drink and other everyday consumables delivered to your home or workplace, audio or video
            recordings and computer software that you have unsealed, newspapers and magazines and books, and
            services for a specific date or period such as catering or an event. A vendor must say clearly on
            the product page when an item falls into one of these categories.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">4. If something is faulty</h2>
          <p>
            Separately, and for longer, section 56 of the Consumer Protection Act gives you{' '}
            <strong>six months from delivery</strong> to return goods that are defective, unsafe, not
            durable, or not fit for the purpose they are ordinarily used for. You may ask for a repair, a
            replacement or a refund, and the choice is yours, not the vendor&apos;s.
          </p>
          <p>
            The vendor bears the cost of that return. This right cannot be signed away by a general
            disclaimer. A vendor may sell an item in a stated condition, such as a second-hand item with a
            described fault. For that to bind you, the vendor must have told you about that specific defect
            before you bought and you must have expressly agreed to take the item as it is. Even then the
            item must still be usable and durable for a reasonable period, and the six-month right applies to
            every other defect.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">5. If it is not what was described</h2>
          <p>
            If goods do not match their description, sample or the specification you ordered, you may refuse
            delivery or return them, and the vendor carries the cost of doing so.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">6. How to start a return</h2>
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

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">7. Orders paid on collection</h2>
          <p>
            Some vendors let you place an order and pay when you collect it. Until you have paid and taken
            the goods, you may cancel at any time at no cost — there is nothing to refund. Once you have
            collected and paid, the rights in sections 3 to 5 above apply as normal.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">8. Goods you did not order</h2>
          <p>
            If a vendor delivers goods you did not order, you do not have to pay for them and you do not have
            to send them back. Section 21 of the Consumer Protection Act treats them as unsolicited goods, and
            they become yours if the supplier does not collect them within the periods the Act sets.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">9. Chargebacks</h2>
          <p>
            If you paid by card and believe a charge was not authorised by you, raise it with your bank.
            Where a dispute is simply about a late or unsatisfactory order, please try the vendor and then
            us first. A chargeback filed before anyone has had the chance to fix the problem costs the
            vendor a fee whatever the outcome, and the steps above usually settle it faster.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">10. If a vendor will not co-operate</h2>
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

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">11. What vendors agree to</h2>
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
