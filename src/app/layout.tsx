import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Stallspace - Your Local Marketplace',
    template: 'Stallspace | %s',
  },
  description: 'Stallspace connects trusted local vendors with customers. Discover unique products, support local businesses, and shop with confidence.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
