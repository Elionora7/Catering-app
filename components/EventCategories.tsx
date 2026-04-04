'use client'

import { FadeUp } from './animations/FadeUp'
import Link from 'next/link'

const categories = [
  {
    name: 'Weddings',
    icon: '💍',
    description: 'Elegant catering for your special day',
    href: '/request-quote',
  },
  {
    name: 'Birthdays',
    icon: '🎂',
    description: 'Celebrate with delicious food',
    href: '/request-quote',
  },
  {
    name: 'Gatherings',
    icon: '👥',
    description: 'Perfect for family and friends',
    href: '/request-quote',
  },
  {
    name: 'Corporate',
    icon: '💼',
    description: 'Professional catering for business',
    href: '/request-quote',
  },
]

export function EventCategories() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0F3D3E]">
      <div className="max-w-7xl mx-auto">
        <FadeUp>
          <h2 className="text-4xl md:text-5xl font-bold text-[#D4AF37] text-center mb-4 font-playfair">
            Event Categories
          </h2>
          <p className="text-center text-white/80 mb-12 text-lg max-w-2xl mx-auto">
            We cater to all your special occasions with premium service
          </p>
        </FadeUp>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {categories.map((category, index) => (
            <FadeUp key={category.name} delay={index * 0.1}>
              <Link href={category.href} className="group">
                <div className="bg-[#0F3D3E] border-2 border-[#D4AF37]/30 rounded-lg p-6 text-center hover:border-[#D4AF37] transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#D4AF37]/20">
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {category.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-[#D4AF37] mb-2 font-playfair">
                    {category.name}
                  </h3>
                  <p className="text-white/70 text-sm">
                    {category.description}
                  </p>
                </div>
              </Link>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  )
}


