'use client'

import PageContainer from '@/components/PageContainer'
import { PageBackground } from '@/components/PageBackground'
import { PageHero } from '@/components/PageHero'
import Link from 'next/link'
import { FadeUp } from '@/components/animations/FadeUp'

export default function ServiceAreasPage() {
  return (
    <PageBackground>
      <PageHero 
        title="Service Areas" 
        subtitle="We deliver authentic Lebanese catering across Sydney" 
      />
      <main className="min-h-screen py-12">
        <PageContainer>
          <div className="max-w-3xl mx-auto">
            {/* Main Content */}
            <FadeUp delay={0.2}>
              <section className="bg-white rounded-lg shadow-xl p-8 md:p-12">
                <div className="text-center mb-8">
                  <p className="text-[#0F3D3E] text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
                    We deliver catering across Sydney. Delivery availability and fees are confirmed automatically during checkout based on your postcode.
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/5 border-l-4 border-[#D4AF37] p-6 md:p-8 rounded-lg">
                  <p className="text-[#0F3D3E] text-base md:text-lg mb-4">
                    If your location is outside our standard service areas, please contact us for a custom quote for large events.
                  </p>
                  <Link 
                    href="/request-quote" 
                    className="inline-block bg-[#D4AF37] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#D4AF37]/90 transition-all duration-200 hover:scale-105 shadow-md"
                  >
                    Request a Custom Quote →
                  </Link>
                </div>
              </section>
            </FadeUp>

            {/* CTA */}
            <FadeUp delay={0.4}>
              <div className="text-center mt-8">
                <Link
                  href="/menu"
                  className="inline-block bg-[#0F3D3E] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#0F3D3E]/90 transition-all duration-200 hover:scale-105 shadow-lg"
                >
                  Browse Our Menu
                </Link>
              </div>
            </FadeUp>
          </div>
        </PageContainer>
      </main>
    </PageBackground>
  )
}
