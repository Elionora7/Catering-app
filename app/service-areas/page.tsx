'use client'

import PageContainer from '@/components/PageContainer'
import { PageBackground } from '@/components/PageBackground'
import { PageHero } from '@/components/PageHero'
import Link from 'next/link'
import { FadeUp } from '@/components/animations/FadeUp'

const areaLinkClass = 'text-[#D4AF37] font-semibold hover:underline'

const standardAreas = [
  {
    name: 'Bankstown',
    text: 'We deliver Lebanese catering to Bankstown for family tables, gatherings, and local events. Choose platters and mezze from the menu, then request a quote if you need a larger spread.',
  },
  {
    name: 'Parramatta',
    text: 'Lebanese catering delivery to Parramatta covers offices and private events around the city’s western business hub. Mediterranean platters and corporate catering are available for weekday and weekend orders.',
  },
  {
    name: 'Inner West Sydney',
    text: 'From home dinners to neighbourhood celebrations, we deliver authentic Lebanese catering across Inner West Sydney. Browse the menu for BBQ and mezze, or request a quote for a larger guest list.',
  },
  {
    name: 'South West Sydney',
    text: 'Eliora Signature Catering delivers Lebanese catering across South West Sydney for family meals and community events. Order platters online or request a quote when you need help planning quantities.',
  },
  {
    name: 'Sydney CBD',
    text: 'Corporate catering Sydney is a regular request in the CBD. We deliver Lebanese and Mediterranean platters to offices and events in the city — check the menu or request a quote for your date.',
  },
] as const

const premiumAreas = [
  {
    name: 'Vaucluse',
    text: 'Lebanese catering delivery to Vaucluse is available for private events and family tables. Review the menu, then request a quote so we can confirm delivery for your postcode.',
  },
  {
    name: 'Watsons Bay',
    text: 'We deliver Lebanese catering to Watsons Bay for gatherings that need sharing platters and Mediterranean mains. Browse the menu or request a quote for your event date.',
  },
  {
    name: 'Mosman',
    text: 'Mosman guests can order authentic Lebanese catering for home events and small functions. Choose from the menu or request a quote for a larger Mediterranean spread.',
  },
  {
    name: 'Double Bay',
    text: 'Lebanese catering delivery to Double Bay covers private events and family meals. See the menu for platters and mezze, or request a quote for corporate catering in Sydney’s east.',
  },
] as const

function AreaLinks() {
  return (
    <p className="mt-3 text-sm">
      <Link href="/menu" className={areaLinkClass}>
        Browse the Lebanese catering menu
      </Link>
      {' · '}
      <Link href="/request-quote" className={areaLinkClass}>
        Request a Lebanese catering quote
      </Link>
    </p>
  )
}

export default function ServiceAreasPage() {
  return (
    <PageBackground>
      <PageHero
        title="Lebanese Catering Delivery Across Sydney"
        subtitle="We deliver authentic Lebanese catering across Sydney"
      />
      <main className="min-h-screen py-12">
        <PageContainer>
          <div className="max-w-3xl mx-auto">
            <FadeUp delay={0.2}>
              <section className="bg-white rounded-lg shadow-xl p-8 md:p-12">
                <div className="text-center mb-8">
                  <p className="text-[#0F3D3E] text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
                    We deliver catering across Sydney. Delivery availability and fees are confirmed automatically during checkout based on your postcode.
                  </p>
                </div>

                <h2 className="text-2xl md:text-3xl font-bold text-[#0F3D3E] mb-6 font-playfair">
                  Standard service areas
                </h2>
                <div className="space-y-8 mb-10">
                  {standardAreas.map((area) => (
                    <article key={area.name}>
                      <h3 className="text-xl font-semibold text-[#0F3D3E] mb-2 font-playfair">
                        {area.name}
                      </h3>
                      <p className="text-[#0F3D3E]/80 leading-relaxed">{area.text}</p>
                      <AreaLinks />
                    </article>
                  ))}
                </div>

                <h2 className="text-2xl md:text-3xl font-bold text-[#0F3D3E] mb-6 font-playfair">
                  Premium Sydney suburbs
                </h2>
                <div className="space-y-8 mb-10">
                  {premiumAreas.map((area) => (
                    <article key={area.name}>
                      <h3 className="text-xl font-semibold text-[#0F3D3E] mb-2 font-playfair">
                        {area.name}
                      </h3>
                      <p className="text-[#0F3D3E]/80 leading-relaxed">{area.text}</p>
                      <AreaLinks />
                    </article>
                  ))}
                </div>

                <div className="bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/5 border-l-4 border-[#D4AF37] p-6 md:p-8 rounded-lg">
                  <p className="text-[#0F3D3E] text-base md:text-lg mb-4">
                    If your location is outside our standard service areas, please{' '}
                    <Link href="/contact" className={areaLinkClass}>
                      contact Eliora Signature Catering
                    </Link>{' '}
                    for a custom quote for large events.
                  </p>
                  <Link
                    href="/request-quote"
                    className="inline-block bg-[#D4AF37] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#D4AF37]/90 transition-all duration-200 hover:scale-105 shadow-md"
                  >
                    Request a Lebanese catering quote →
                  </Link>
                </div>
              </section>
            </FadeUp>

            <FadeUp delay={0.4}>
              <div className="text-center mt-8">
                <Link
                  href="/menu"
                  className="inline-block bg-[#0F3D3E] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#0F3D3E]/90 transition-all duration-200 hover:scale-105 shadow-lg"
                >
                  Browse the Lebanese catering menu
                </Link>
              </div>
            </FadeUp>
          </div>
        </PageContainer>
      </main>
    </PageBackground>
  )
}
