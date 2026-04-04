'use client'

import Link from 'next/link'
import Image from 'next/image'
import { FadeUp } from '@/components/animations/FadeUp'

const categories = [
  {
    key: 'BBQ & Grills',
    title: 'BBQ & Grills',
    description: 'Skewers, wings, and mixed grill platters—perfect for events.',
    imageUrl: '/menu-images/bbq_mix.png',
  },
  {
    key: 'Mediterranean Main Platters',
    title: 'Mediterranean Main Platters',
    description: 'Signature mains and traditional platters for sharing.',
    imageUrl: '/menu-images/rice%20with%20meat.png',
  },
  {
    key: 'Gourmet Mini Sandwiches & Sliders',
    title: 'Gourmet Mini Sandwiches & Sliders',
    description: 'Mini bites, wraps, and canapés for easy catering.',
    imageUrl: '/menu-images/mix-finger-food.png',
  },
  {
    key: 'Salads',
    title: 'Salads',
    description: 'Fresh, vibrant salads to balance your spread.',
    imageUrl: '/menu-images/fattouch.png',
  },
  {
    key: 'Vegetarian Lebanese Platters',
    title: 'Vegetarian Lebanese Platters',
    description: 'Vegetarian platters and classic Lebanese favourites.',
    imageUrl: '/menu-images/vg-vine_leaves.png',
  },
  {
    key: 'Desserts & Cups',
    title: 'Desserts & Cups',
    description: 'Finish strong with sweet bites, plus salad & fruit cups.',
    imageUrl: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&h=600&fit=crop',
  },
] as const

export function HomeMenuCategories() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#FFF9EB]">
      <div className="max-w-7xl mx-auto">
        <FadeUp>
          <h2 className="text-4xl md:text-5xl font-bold text-[#0F3D3E] text-center mb-4 font-playfair">
            Menu Categories
          </h2>
          <p className="text-center text-[#0F3D3E]/70 mb-12 text-lg max-w-2xl mx-auto">
            Start with a category, then build your cart in minutes.
          </p>
        </FadeUp>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, index) => (
            <FadeUp key={cat.key} delay={index * 0.08}>
              <Link
                href={`/menu?category=${encodeURIComponent(cat.key)}`}
                className="group block bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-[#D4AF37]"
              >
                <div className="relative h-44 sm:h-48 overflow-hidden bg-gray-100">
                  <Image
                    src={cat.imageUrl}
                    alt={cat.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-[#0F3D3E] text-lg group-hover:text-[#D4AF37] transition-colors">
                      {cat.title}
                    </h3>
                    <span className="text-[#D4AF37] font-bold">→</span>
                  </div>
                  <p className="text-sm text-[#0F3D3E]/70 mt-2">
                    {cat.description}
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

