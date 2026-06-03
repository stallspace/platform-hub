import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: "MARCRTE — South Africa's Vetted Marketplace",
    template: '%s | MARCRTE',
  },
  description: 'MARCRTE is a vetted online marketplace connecting South African small businesses with customers.',
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
