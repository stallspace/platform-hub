import Navbar from '@/components/marketplace/Navbar'
import Footer from '@/components/marketplace/Footer'
import TrackPageView from '@/components/marketplace/TrackPageView'

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <TrackPageView />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
