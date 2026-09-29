import Link from 'next/link'
import { FadeUp } from '@/components/animations/FadeUp'

export function HomeIntro() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-3xl mx-auto">
        <FadeUp>
          <h2 className="text-3xl md:text-4xl font-bold text-[#0F3D3E] mb-6 font-playfair text-center">
            Authentic Lebanese catering, delivered across Sydney
          </h2>
          <div className="space-y-4 text-[#0F3D3E]/80 text-base md:text-lg leading-relaxed">
            <p>
              Eliora Signature Catering is a delivery-only Lebanese and Mediterranean kitchen serving
              Sydney. We prepare mezze, BBQ platters, and sharing mains for events, offices, and
              family tables — then deliver them across{' '}
              <Link href="/service-areas" className="text-[#D4AF37] font-semibold hover:underline">
                our Sydney service areas
              </Link>
              .
            </p>
            <p>
              Authentic Lebanese catering here means grilled meats, olive-oil salads, dips, and
              vegetarian platters in the Mediterranean style, built for sharing. Every dish is made
              from scratch using homemade family recipes, with the same care and quality you'd expect
              from a home kitchen — brought to a scale that suits your event. Browse the{' '}
              <Link href="/menu" className="text-[#D4AF37] font-semibold hover:underline">
                Lebanese catering menu
              </Link>{' '}
              for BBQ, mezze, and mains, or{' '}
              <Link href="/request-quote" className="text-[#D4AF37] font-semibold hover:underline">
                request a Lebanese catering quote
              </Link>{' '}
              for larger gatherings and{' '}
              <Link href="/request-quote" className="text-[#D4AF37] font-semibold hover:underline">
                corporate catering in Sydney
              </Link>
              .
            </p>
            <p>
              We deliver to Bankstown, Parramatta, Inner West Sydney, South West Sydney, Sydney CBD,
              and premium suburbs including Vaucluse, Watsons Bay, Mosman, and Double Bay. Questions?
              Call{' '}
              <a href="tel:0410759741" className="text-[#D4AF37] font-semibold hover:underline">
                0410 759 741
              </a>{' '}
              or use the{' '}
              <Link href="/contact" className="text-[#D4AF37] font-semibold hover:underline">
                Eliora Signature Catering contact page
              </Link>
              . Open Monday–Sunday, 9:00 AM – 6:00 PM.
            </p>
          </div>
        </FadeUp>
      </div>
    </section>
  )
}
