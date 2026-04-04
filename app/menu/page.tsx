'use client'

import { useMeals } from '@/hooks/useMeals'
import { MealCard } from '@/components/MealCard'
import { CategoryCard } from '@/components/CategoryCard'
import { useState, useMemo, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import PageContainer from '@/components/PageContainer'
import { PageBackground } from '@/components/PageBackground'
import { PageHero } from '@/components/PageHero'

// Define category order and display names
const CATEGORY_ORDER = [
  'Gourmet Mini Sandwiches & Sliders',
  'Finger Food (Per Dozen)',
  'Salads',
  'Dips & Trays',
  'Pasta & Noodle Platters',
  'BBQ & Grills',
  'Mediterranean Main Platters',
  'Paella',
  'Vegetarian Lebanese Platters',
  'Desserts & Cups',
]

const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  'Finger Food': 'Gourmet Mini Sandwiches & Sliders',
  'Dips': 'Dips & Trays',
  'Trays': 'Dips & Trays',
  'Pasta & Noodles': 'Pasta & Noodle Platters',
  'BBQ': 'BBQ & Grills',
  'Mediterranean Mains': 'Mediterranean Main Platters',
  'Vegetarian Lebanese': 'Vegetarian Lebanese Platters',
}

function MenuPageContent() {
  const { data: meals, isLoading, error } = useMeals()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Check for category in URL params
  useEffect(() => {
    const categoryParam = searchParams?.get('category')
    if (categoryParam) {
      setSelectedCategory(decodeURIComponent(categoryParam))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setSelectedCategory(null)
    }
  }, [searchParams])

  // Organize meals by category
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

  // Get sorted categories - must be called before conditional returns
  const sortedCategories = useMemo(() => {
    const categories = Object.keys(mealsByCategory)
    return CATEGORY_ORDER.filter(cat => categories.includes(cat))
      .concat(categories.filter(cat => !CATEGORY_ORDER.includes(cat)))
  }, [mealsByCategory])

  // Get selected category meals - must be called before conditional returns
  const selectedCategoryMeals = useMemo(() => {
    if (!selectedCategory) return null
    return mealsByCategory[selectedCategory] || []
  }, [selectedCategory, mealsByCategory])

  if (isLoading) {
    return (
      <PageBackground>
        <PageHero title="Our Menu" subtitle="Authentic Lebanese catering for every occasion" />
        <main className="min-h-screen">
          <PageContainer>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-12">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-200 rounded-lg h-80 animate-pulse"
                ></div>
              ))}
            </div>
          </PageContainer>
        </main>
      </PageBackground>
    )
  }

  if (error) {
    return (
      <PageBackground>
        <PageHero title="Our Menu" subtitle="Authentic Lebanese catering for every occasion" />
        <main className="min-h-screen">
          <PageContainer>
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-12">
              Failed to load meals. Please try again later.
            </div>
          </PageContainer>
        </main>
      </PageBackground>
    )
  }

  // Handle category selection
  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category)
    router.push(`/menu?category=${encodeURIComponent(category)}`)
    // Scroll to top when category is selected
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Handle back to categories
  const handleBackToCategories = () => {
    setSelectedCategory(null)
    router.push('/menu')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <PageBackground>
      <PageHero 
        title={selectedCategory || "Our Menu"} 
        subtitle={selectedCategory ? "Browse all items in this category" : "Authentic Lebanese catering for every occasion"} 
      />
      <main className="min-h-screen">
        <PageContainer>
          {selectedCategory && (
            <div className="mb-6 pt-8">
              <button
                onClick={handleBackToCategories}
                className="flex items-center text-[#D4AF37] hover:text-[#0F3D3E] transition-colors mb-4 font-medium"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Categories
              </button>
            </div>
          )}

        {/* Show category cards or selected category items */}
        {!selectedCategory ? (
          // Category selection view
          sortedCategories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedCategories.map((category) => {
                const categoryMeals = mealsByCategory[category] || []
                const availableCount = categoryMeals.filter((meal) => meal.isAvailable).length
                
                return (
                  <CategoryCard
                    key={category}
                    name={category}
                    itemCount={availableCount}
                    onClick={() => handleCategoryClick(category)}
                  />
                )
              })}
            </div>
          ) : meals?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No meals available at the moment.</p>
            </div>
          ) : null
        ) : (
          // Selected category items view
          selectedCategoryMeals ? (
            <div>
              {(() => {
                const availableMeals = selectedCategoryMeals.filter((meal) => meal.isAvailable)
                const unavailableMeals = selectedCategoryMeals.filter((meal) => !meal.isAvailable)

                return (
                  <>
                    {availableMeals.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 items-stretch">
                        {availableMeals.map((meal, index) => (
                          <div key={meal.id} id={`meal-${meal.id}`} className="h-full min-h-0">
                            <MealCard meal={meal} index={index} />
                          </div>
                        ))}
                      </div>
                    )}

                    {unavailableMeals.length > 0 && (
                      <div className="mt-8">
                        <h3 className="text-lg font-medium text-gray-500 mb-4">
                          Currently Unavailable
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                          {unavailableMeals.map((meal, index) => (
                            <div key={meal.id} id={`meal-${meal.id}`} className="h-full min-h-0">
                              <MealCard meal={meal} index={availableMeals.length + index} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {availableMeals.length === 0 && unavailableMeals.length === 0 && (
                      <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No items in this category.</p>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          ) : null
        )}
        </PageContainer>
      </main>
    </PageBackground>
  )
}

export default function MenuPage() {
  return (
    <Suspense fallback={
      <PageBackground>
        <PageHero title="Our Menu" subtitle="Authentic Lebanese catering for every occasion" />
        <main className="min-h-screen">
          <PageContainer>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-12">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-200 rounded-lg h-80 animate-pulse"
                ></div>
              ))}
            </div>
          </PageContainer>
        </main>
      </PageBackground>
    }>
      <MenuPageContent />
    </Suspense>
  )
}

