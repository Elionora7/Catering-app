'use client'

import Link from 'next/link'
import { FadeUp } from '@/components/animations/FadeUp'

export function LargeEventCTA() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <FadeUp>
          <div className="bg-gradient-to-r from-[#0F3D3E] to-[#0F3D3E]/90 rounded-2xl p-8 md:p-12 text-center shadow-xl">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-playfair">
              Planning a Large Event?
            </h2>
            <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
              For weddings, corporate events, and large gatherings, request a custom catering quote.
            </p>
            <Link
              href="/request-quote"
              className="inline-block px-8 py-3 bg-[#D4AF37] text-[#0F3D3E] font-semibold rounded-lg hover:bg-[#c9a030] transition-all duration-200 hover:scale-105 shadow-lg"
            >
              Request Quote
            </Link>
          </div>
        </FadeUp>
      </div>
    </section>
  )
}

