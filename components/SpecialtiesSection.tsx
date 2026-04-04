'use client'

import { FadeUp } from './animations/FadeUp'
import { useMeals } from '@/hooks/useMeals'
import Image from 'next/image'
import Link from 'next/link'

export function SpecialtiesSection() {
  const { data: meals, isLoading } = useMeals()
  
  // Filter for Paella and Mediterranean Main Platters
  const specialties = meals?.filter(meal => {
    const category = meal.category || ''
    return category === 'Paella' || category === 'Mediterranean Mains'
  }).slice(0, 8) || []

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#FFF9EB]">
      <div className="max-w-7xl mx-auto">
        <FadeUp>
          <h2 className="text-4xl md:text-5xl font-bold text-[#0F3D3E] text-center mb-4 font-playfair">
            Our Specialties
          </h2>
          <p className="text-center text-[#0F3D3E]/70 mb-12 text-lg max-w-2xl mx-auto">
            Discover our signature dishes crafted with authentic Lebanese and Mediterranean flavors
          </p>
        </FadeUp>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg h-80 animate-pulse" />
            ))}
          </div>
        ) : specialties.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No specialties available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {specialties.map((meal, index) => (
              <FadeUp key={meal.id} delay={index * 0.1}>
                <Link href={`/menu`} className="group">
                  <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-[#D4AF37]">
                    <div className="relative h-48 overflow-hidden">
                      {meal.imageUrl ? (
                        <Image
                          src={meal.imageUrl}
                          alt={meal.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#D4AF37]/20 to-[#0F3D3E]/20 flex items-center justify-center">
                          <span className="text-[#0F3D3E]/40 text-4xl">🍽️</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-[#0F3D3E] mb-2 group-hover:text-[#D4AF37] transition-colors">
                        {meal.name}
                      </h3>
                      {meal.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {meal.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="text-[#D4AF37] font-bold text-lg">
                          {meal.pricingType === 'PER_PERSON' 
                            ? `$${meal.price.toFixed(2)} per person`
                            : meal.pricingType === 'SIZED' && meal.priceSmall
                            ? `From $${meal.priceSmall.toFixed(2)}`
                            : `$${meal.price.toFixed(2)}`
                          }
                        </p>
                        {meal.minimumQuantity && (
                          <span className="text-xs text-gray-500">
                            Min: {meal.minimumQuantity}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </FadeUp>
            ))}
          </div>
        )}

        <FadeUp delay={0.8}>
          <div className="text-center mt-12">
            <Link
              href="/menu"
              className="inline-block px-8 py-3 bg-[#0F3D3E] text-white font-semibold rounded-lg hover:bg-[#0F3D3E]/90 transition-all duration-200 hover:scale-105"
            >
              View Full Menu
            </Link>
          </div>
        </FadeUp>
      </div>
    </section>
  )
}


