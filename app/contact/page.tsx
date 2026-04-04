'use client'

import { PageBackground } from '@/components/PageBackground'
import { PageHero } from '@/components/PageHero'
import PageContainer from '@/components/PageContainer'
import { FadeUp } from '@/components/animations/FadeUp'
import Link from 'next/link'

export default function ContactPage() {
  return (
    <PageBackground>
      <PageHero 
        title="Contact Us" 
        subtitle="Get in touch with Eliora Signature Catering" 
      />
      <main className="min-h-screen py-12">
        <PageContainer>
          <div className="max-w-4xl mx-auto">
            <FadeUp delay={0.2}>
              <div className="bg-white rounded-lg shadow-xl p-8 md:p-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="text-xl font-semibold text-[#0F3D3E] mb-4 font-playfair">Contact Information</h3>
                    <div className="space-y-3 text-[#0F3D3E]/80">
                      <p>
                        <strong className="text-[#0F3D37]">Email:</strong> info@eliorasignaturecatering.com.au
                      </p>
                      <p>
                        <strong className="text-[#0F3D37]">Phone:</strong>{' '}
                        <a href="tel:0410759741" className="text-[#D4AF37] hover:underline">
                          0410 759 741
                        </a>
                      </p>
                      <p>
                        <strong className="text-[#0F3D37]">Hours:</strong> Monday – Sunday: 9:00 AM – 6:00 PM
                      </p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[#0F3D3E] mb-4 font-playfair">Quick Links</h3>
                    <div className="space-y-2">
                      <Link href="/menu" className="block text-[#D4AF37] hover:text-[#0F3D3E] transition-colors">
                        Browse Menu →
                      </Link>
                      <Link href="/request-quote" className="block text-[#D4AF37] hover:text-[#0F3D3E] transition-colors">
                        Request a Quote →
                      </Link>
                      <Link href="/service-areas" className="block text-[#D4AF37] hover:text-[#0F3D3E] transition-colors">
                        Service Areas →
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-8">
                  <p className="text-[#0F3D3E]/70 text-center">
                    For large events or custom catering needs, please use our{' '}
                    <Link href="/request-quote" className="text-[#D4AF37] hover:underline font-semibold">
                      Request a Quote
                    </Link>{' '}
                    form for a personalized quote.
                  </p>
                </div>
              </div>
            </FadeUp>
          </div>
        </PageContainer>
      </main>
    </PageBackground>
  )
}
