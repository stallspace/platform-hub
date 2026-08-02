import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://stallspace.co.za'),
  title: {
    default: 'Stallspace - Your Marketplace',
    template: 'Stallspace | %s',
  },
  description: 'Stallspace connects trusted local vendors with customers. Discover unique products, support local businesses, and shop with confidence.',
  openGraph: {
    type: 'website',
    siteName: 'Stallspace',
    title: 'Stallspace — Your Marketplace',
    description: "South Africa's vetted online marketplace. Discover trusted vendors and shop with confidence.",
    url: '/',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Stallspace — Your Marketplace' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stallspace — Your Marketplace',
    description: "South Africa's vetted online marketplace. Discover trusted vendors and shop with confidence.",
    images: ['/og-image.png'],
  },
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
