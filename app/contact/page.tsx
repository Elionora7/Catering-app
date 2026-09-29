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
        title="Contact Eliora — Lebanese Catering Sydney"
        subtitle="Get in touch with Eliora Signature Catering"
      />
      <main className="min-h-screen py-12">
        <PageContainer>
          <div className="max-w-4xl mx-auto">
            <FadeUp delay={0.2}>
              <div className="bg-white rounded-lg shadow-xl p-8 md:p-12">
                <p className="text-[#0F3D3E]/80 text-lg leading-relaxed mb-8">
                  Contact Eliora Signature Catering for authentic Lebanese catering in Sydney. We are
                  delivery-only — use the phone, email, or{' '}
                  <Link href="/request-quote" className="text-[#D4AF37] font-semibold hover:underline">
                    Lebanese catering quote form
                  </Link>{' '}
                  for events and corporate catering.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h2 className="text-xl font-semibold text-[#0F3D3E] mb-4 font-playfair">Contact Information</h2>
                    <div className="space-y-3 text-[#0F3D3E]/80">
                      <p>
                        <strong className="text-[#0F3D37]">Email:</strong>{' '}
                        <a href="mailto:info@eliorasignaturecatering.com.au" className="text-[#D4AF37] hover:underline">
                          info@eliorasignaturecatering.com.au
                        </a>
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
                      <p>
                        <strong className="text-[#0F3D37]">Social:</strong>{' '}
                        <a
                          href="https://www.facebook.com/elioracatering"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#D4AF37] hover:underline"
                        >
                          Facebook
                        </a>
                        {' · '}
                        <a
                          href="https://www.instagram.com/eliorasignaturecatering"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#D4AF37] hover:underline"
                        >
                          Instagram
                        </a>
                      </p>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-[#0F3D3E] mb-4 font-playfair">Quick Links</h2>
                    <div className="space-y-2">
                      <Link href="/menu" className="block text-[#D4AF37] hover:text-[#0F3D3E] transition-colors">
                        Browse the Lebanese catering menu →
                      </Link>
                      <Link href="/request-quote" className="block text-[#D4AF37] hover:text-[#0F3D3E] transition-colors">
                        Request a Lebanese catering quote →
                      </Link>
                      <Link href="/service-areas" className="block text-[#D4AF37] hover:text-[#0F3D3E] transition-colors">
                        Lebanese catering delivery areas in Sydney →
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-8">
                  <p className="text-[#0F3D3E]/70 text-center">
                    For large events or custom catering needs, please use our{' '}
                    <Link href="/request-quote" className="text-[#D4AF37] hover:underline font-semibold">
                      Lebanese catering quote form
                    </Link>{' '}
                    for a personalized quote.
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
