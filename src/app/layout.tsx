import type { Metadata, Viewport } from 'next'
import './globals.css'
import InstallPrompt from '@/components/pwa/InstallPrompt'
import ServiceWorkerRegistrar from '@/components/pwa/ServiceWorkerRegistrar'

export const viewport: Viewport = {
  themeColor: '#0D3B2E',
  width: 'device-width',
  initialScale: 1,
  // Allow pinch-zoom for accessibility, but stop iOS auto-zooming on inputs
  // (handled by 16px font sizes in globals.css rather than blocking zoom).
  maximumScale: 5,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://stallspace.co.za'),
  title: {
    default: 'Stallspace | Your Marketplace',
    template: 'Stallspace | %s',
  },
  description: 'Stallspace connects trusted local vendors with customers. Discover unique products, support local businesses, and shop with confidence.',
  openGraph: {
    type: 'website',
    siteName: 'Stallspace',
    title: 'Stallspace — Your Marketplace',
    description: 'The vetted online marketplace. Discover trusted vendors and shop with confidence.',
    url: '/',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Stallspace — Your Marketplace' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stallspace — Your Marketplace',
    description: 'The vetted online marketplace. Discover trusted vendors and shop with confidence.',
    images: ['/og-image.png'],
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Stallspace',
    statusBarStyle: 'black-translucent',
  },
  applicationName: 'Stallspace',
  formatDetection: { telephone: false },
  // Modern equivalent of the deprecated apple-mobile-web-app-capable tag.
  other: { 'mobile-web-app-capable': 'yes' },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-ZA">
      <body>
        {children}
        <ServiceWorkerRegistrar />
        <InstallPrompt />
      </body>
    </html>
  )
}
