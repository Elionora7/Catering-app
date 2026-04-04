'use client'

import { useState, useMemo } from 'react'
import { FadeUp } from './animations/FadeUp'
import Image from 'next/image'
import { useMeals } from '@/hooks/useMeals'
import Link from 'next/link'

// Category mapping to match menu page
const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  'Finger Food': 'Gourmet Mini Sandwiches & Sliders',
  'Dips': 'Dips & Trays',
  'Trays': 'Dips & Trays',
  'Pasta & Noodles': 'Pasta & Noodle Platters',
  'BBQ': 'BBQ & Grills',
  'Mediterranean Mains': 'Mediterranean Main Platters',
  'Vegetarian Lebanese': 'Vegetarian Lebanese Platters',
}

export function Gallery() {
  const { data: meals, isLoading } = useMeals()
  const [activeFilter, setActiveFilter] = useState('All')

  // Organize meals by category (same logic as menu page)
  const mealsByCategory = useMemo(() => {
    if (!meals) return {}

    const categorized: Record<string, typeof meals> = {}

    meals.forEach((meal) => {
      let category = meal.category || 'Other'
      
      // Map category names to display names
      if (category === 'Finger Food' && meal.pricingType === 'PER_DOZEN') {
        category = 'Finger Food (Per Dozen)'
      } else if (category === 'Finger Food' && meal.pricingType === 'PER_ITEM') {
        category = 'Gourmet Mini Sandwiches & Sliders'
      } else if (category === 'Dips' || category === 'Trays') {
        category = 'Dips & Trays'
      } else if (category === 'Pasta & Noodles') {
        category = 'Pasta & Noodle Platters'
      } else if (category === 'BBQ') {
        category = 'BBQ & Grills'
      } else if (category === 'Mediterranean Mains') {
        category = 'Mediterranean Main Platters'
      } else if (category === 'Vegetarian Lebanese') {
        category = 'Vegetarian Lebanese Platters'
      }

      if (!categorized[category]) {
        categorized[category] = []
      }
      categorized[category].push(meal)
    })

    return categorized
  }, [meals])

  // Get all unique categories for filters
  const categories = useMemo(() => {
    const cats = Object.keys(mealsByCategory).sort()
    return ['All', ...cats]
  }, [mealsByCategory])

  // Get gallery items (meals with images, limited per category)
  const galleryItems = useMemo(() => {
    if (!meals) return []

    const items: Array<{ id: string; name: string; category: string; imageUrl: string | null }> = []

    Object.entries(mealsByCategory).forEach(([category, categoryMeals]) => {
      // Get up to 3 meals per category that have images
      const mealsWithImages = categoryMeals
        .filter(meal => meal.imageUrl && meal.isAvailable)
        .slice(0, 3)
      
      mealsWithImages.forEach(meal => {
        items.push({
          id: meal.id,
          name: meal.name,
          category,
          imageUrl: meal.imageUrl,
        })
      })
    })

    return items
  }, [meals, mealsByCategory])

  const filteredItems = activeFilter === 'All'
    ? galleryItems
    : galleryItems.filter(item => item.category === activeFilter)

  if (isLoading) {
    return (
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#FFF9EB]">
        <div className="max-w-7xl mx-auto">
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-64 sm:h-80 animate-pulse break-inside-avoid mb-4" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#FFF9EB]">
      <div className="max-w-7xl mx-auto">
        <FadeUp>
          <h2 className="text-4xl md:text-5xl font-bold text-[#0F3D3E] text-center mb-4 font-playfair">
            Our Gallery
          </h2>
          <p className="text-center text-[#0F3D3E]/70 mb-12 text-lg max-w-2xl mx-auto">
            A glimpse into our culinary creations
          </p>
        </FadeUp>

        {/* Filters */}
        <FadeUp delay={0.2}>
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveFilter(category)}
                className={`px-6 py-2 rounded-full font-semibold transition-all duration-200 ${
                  activeFilter === category
                    ? 'bg-[#D4AF37] text-[#0F3D3E]'
                    : 'bg-white text-[#0F3D3E] hover:bg-[#D4AF37]/20'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </FadeUp>

        {/* Masonry Grid */}
        {filteredItems.length > 0 ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {filteredItems.map((item, index) => (
              <FadeUp key={item.id} delay={index * 0.1}>
                <Link href="/menu" className="block group relative overflow-hidden rounded-lg break-inside-avoid mb-4 cursor-pointer">
                  <div className="relative h-64 sm:h-80 bg-gray-100">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#D4AF37]/20 to-[#0F3D3E]/20 flex items-center justify-center">
                        <span className="text-[#0F3D3E]/40 text-4xl">🍽️</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-[#0F3D3E]/0 group-hover:bg-[#0F3D3E]/70 transition-all duration-300 flex flex-col items-center justify-center p-4">
                      <p className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-semibold text-lg text-center mb-2">
                        {item.name}
                      </p>
                      <p className="text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium">
                        {item.category}
                      </p>
                    </div>
                  </div>
                </Link>
              </FadeUp>
            ))}
          </div>
        ) : (
          <FadeUp delay={0.3}>
            <div className="text-center py-12">
              <p className="text-[#0F3D3E]/70 text-lg">
                No items found in this category.
              </p>
            </div>
          </FadeUp>
        )}
      </div>
    </section>
  )
}


