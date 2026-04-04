'use client'

import Image from 'next/image'
import Link from 'next/link'
import { FadeUp } from '@/components/animations/FadeUp'

const highlights = [
  { title: 'BBQ platter', src: '/menu-images/bbq_mix.png' },
  { title: 'Lebanese mixed platter', src: '/menu-images/rice%20with%20meat.png' },
  { title: 'Finger food table', src: '/menu-images/mix-finger-food.png' },
  { title: 'Mediterranean salads', src: '/menu-images/fattouch.png' },
  { title: 'Paella', src: '/menu-images/paella.png' },
  { title: 'Dessert table', src: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=900&h=675&fit=crop' },
] as const

export function CateringHighlights() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#FFF9EB]">
      <div className="max-w-7xl mx-auto">
        <FadeUp>
          <h2 className="text-4xl md:text-5xl font-bold text-[#0F3D3E] text-center mb-4 font-playfair">
            Catering Highlights
          </h2>
          <p className="text-center text-[#0F3D3E]/70 mb-12 text-lg max-w-2xl mx-auto">
            A small preview of our catering style.
          </p>
        </FadeUp>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {highlights.map((item, index) => (
            <FadeUp key={item.title} delay={index * 0.08}>
              <div className="group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-[#D4AF37]">
                <div className="relative h-48 sm:h-56 overflow-hidden bg-gray-100">
                  <Image
                    src={item.src}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <p className="font-semibold text-[#0F3D3E] group-hover:text-[#D4AF37] transition-colors">
                    {item.title}
                  </p>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>

        <FadeUp delay={0.6}>
          <div className="text-center mt-12">
            <Link
              href="/menu"
              className="inline-block px-8 py-3 bg-[#0F3D3E] text-white font-semibold rounded-lg hover:bg-[#0F3D3E]/90 transition-all duration-200 hover:scale-105"
            >
              View Menu
            </Link>
          </div>
        </FadeUp>
      </div>
    </section>
  )
}

