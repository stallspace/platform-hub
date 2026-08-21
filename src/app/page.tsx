import { redirect } from 'next/navigation'

/**
 * The marketplace is the homepage of Stallspace. Visiting the root domain
 * sends people straight to it.
 */
export default function RootPage() {
  redirect('/marketplace')
}
