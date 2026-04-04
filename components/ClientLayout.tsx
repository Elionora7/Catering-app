'use client'

import { CartProvider } from '@/context/CartContext'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { BookingWidgetMobile } from '@/components/BookingWidgetMobile'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <Navbar />
      <div className="pt-28 pb-20 lg:pb-0">
        {children}
      </div>
      <Footer />
      <BookingWidgetMobile />
    </CartProvider>
  )
}







