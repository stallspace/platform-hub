import Link from 'next/link'

export const metadata = {
  title: 'Delivery Policy | Stallspace',
  description:
    'How delivery and collection work on Stallspace: areas, timeframes, costs, and what happens when an order does not arrive.',
}

export default function DeliveryPolicyPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link href="/marketplace" className="text-sm text-[#2ECC8E] hover:underline mb-8 inline-block">
          ← Back to Marketplace
        </Link>

        <h1 className="text-3xl font-bold text-[#0D3B2E] mb-2">Delivery Policy</h1>
        {/* Pinned, not generated. Bump by hand when the text changes. */}
        <p className="text-sm text-[#9CA3AF] mb-10">Last updated: 19 September 2026</p>

        <div className="prose prose-sm max-w-none text-[#374151] space-y-6">
          <div className="bg-[#F8FAF3] border border-[#E5E7EB] rounded-xl p-5 not-prose">
            <p className="text-sm text-[#374151] m-0">
              <strong className="text-[#0D3B2E]">In short:</strong> the vendor you bought from delivers your
              order, not Stallspace. Each storefront publishes its own delivery areas, cost and timeframe,
              and you see the delivery fee added to your total before you pay. If your order does not
              arrive, the rules below say what you are entitled to.
            </p>
          </div>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">1. Who delivers your order</h2>
          <p>
            Stallspace is a marketplace. Every storefront is an independent business that holds its own
            stock and is the seller of record. That vendor arranges delivery or collection, and your
            contract of sale is with them. Stallspace does not warehouse, pack or ship anything.
          </p>
          <p>
            Each vendor sets their own terms. You will find them in the{' '}
            <strong>Delivery &amp; Collection</strong> panel on that vendor&apos;s storefront and on every
            product page, before you add anything to your cart.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">2. Delivery areas</h2>
          <p>
            Vendors deliver only to the areas listed on their storefront. Where a vendor has listed no
            areas, assume they deliver nationally within South Africa and confirm with them using the
            enquiry form before ordering. No vendor on this marketplace ships outside South Africa unless
            their storefront says so.
          </p>
          <p>
            If you place an order for an address a vendor cannot reach, they must tell you as soon as they
            know and cancel the order with a full refund within 30 days, as section 46 of the Electronic
            Communications and Transactions Act requires. You are not charged for a delivery that was never
            possible.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">3. Delivery cost</h2>
          <p>
            The delivery fee is set by the vendor and is shown on their storefront, on each product page,
            and again as a separate line on the checkout summary. It is added to your order total before
            you are sent to the payment page. <strong>You are never charged a delivery fee that was not
            shown to you before you paid.</strong> The only charge that can arise afterwards is the cost of
            a second delivery attempt where the first failed for a reason on your side, and section 9 below
            sets out how that works.
          </p>
          <p>
            Some vendors set a free-delivery threshold, for example free delivery on orders over R500. Where
            they do, the threshold is stated next to the fee and is applied automatically to your order
            total. All prices and fees on Stallspace are in South African Rand and include VAT where the
            vendor is VAT registered.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">4. Delivery timeframes</h2>
          <p>
            Where a vendor publishes an estimated delivery time, that estimate is what they are working to.
            It counts business days and it runs from when you place the order. A vendor must confirm an
            order within two business days, and the statutory period below runs from the order date whatever
            the vendor does.
          </p>
          <p>
            Where a vendor publishes no estimate, section 46 of the Electronic Communications and
            Transactions Act applies. The vendor must deliver{' '}
            <strong>within 30 days of the day you placed the order</strong>. If they do not, you may cancel
            with seven days&apos; written notice and receive a full refund.
          </p>
          <p>
            A vendor who cannot meet their own estimate must tell you. They may offer a later date, and you
            are free to accept it or to cancel for a full refund instead.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">5. Collection</h2>
          <p>
            Some vendors offer collection instead of, or as well as, delivery. Where they do, their
            collection address, hours and any instructions appear on their storefront. Choose collection at
            checkout and no delivery fee is charged.
          </p>
          <p>
            A vendor may also let you pay when you collect. Where that option is offered, no payment is
            taken online, and you may cancel at any time before collecting at no cost.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">6. Tracking your order</h2>
          <p>
            You receive an email when your order is placed, and again each time the vendor moves it forward
            to confirmed, processing, shipped or delivered. Signed-in customers can see the same status
            under <strong>My Orders</strong>. Where a courier issues a tracking number, the vendor passes it
            to you directly.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">7. Risk and ownership</h2>
          <p>
            Risk in the goods passes to you on delivery to the address you gave, or on collection. Until
            then it sits with the vendor. Goods damaged or lost in transit are the vendor&apos;s
            responsibility, not yours.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">8. If your order does not arrive</h2>
          <p>
            Contact the vendor first, using the enquiry form on their storefront or the email address and
            phone number they publish, and give them your order number. Vendors are required to respond
            within <strong>five business days</strong>.
          </p>
          <p>Where the order has not arrived, you are entitled to one of the following, and the choice is yours:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>redelivery at the vendor&apos;s cost, or</li>
            <li>cancellation of the order and a full refund, including the delivery fee you paid.</li>
          </ul>
          <p>
            You may examine the goods when they arrive, before you accept delivery, and you may refuse
            delivery there and then if they are not what you ordered. If the goods arrive damaged, short, or
            not what you ordered, tell the vendor within a reasonable time. The vendor carries the cost of the return and of putting it right. Your rights under the
            Consumer Protection Act are set out in our{' '}
            <Link href="/legal/returns-and-refunds" className="text-[#2ECC8E] hover:underline">
              Returns, Refunds &amp; Cancellations
            </Link>{' '}
            policy and are not reduced by anything on this page.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">9. Failed delivery attempts</h2>
          <p>
            If a courier cannot deliver because nobody was there or the address you supplied was wrong or
            incomplete, the vendor may charge you the actual cost of a second attempt. They must tell you
            that cost before making it. A vendor may not charge a redelivery fee for a failure that was
            theirs or the courier&apos;s.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">10. If a vendor will not co-operate</h2>
          <p>
            Email{' '}
            <a href="mailto:support@stallspace.co.za" className="text-[#2ECC8E] hover:underline">
              support@stallspace.co.za
            </a>{' '}
            with your order number and what has happened. Stallspace never received your payment, so only
            the vendor can decide to refund it. We will take the matter up with the vendor where we can, and
            repeated failure to deliver is grounds for removing them from the marketplace. We cannot
            guarantee an outcome.
          </p>
          <p>
            You may also take a complaint to the National Consumer Commission or a recognised consumer goods
            ombud, independently of us.
          </p>

          <p className="text-xs text-[#9CA3AF] pt-6 border-t border-[#E5E7EB]">
            This page summarises obligations under the Electronic Communications and Transactions Act 25 of
            2002 and the Consumer Protection Act 68 of 2008. It is a plain-language summary, not legal
            advice, and the Acts themselves prevail where this page is unclear or incomplete.
          </p>
        </div>
      </div>
    </div>
  )
}
