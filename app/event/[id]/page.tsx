'use client'

import { use } from 'react'
import { useEvent } from '@/hooks/useEvents'
import { useMeals } from '@/hooks/useMeals'
import { MealCard } from '@/components/MealCard'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface EventPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EventPage({ params }: EventPageProps) {
  const { id } = use(params)
  const { data: session } = useSession()
  const { data: event, isLoading: eventLoading, error: eventError } = useEvent(id)
  const { data: meals, isLoading: mealsLoading } = useMeals()

  if (eventLoading) {
    return (
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gray-200 rounded-lg h-64 animate-pulse mb-8"></div>
        </div>
      </main>
    )
  }

  if (eventError || !event) {
    return (
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Event not found or failed to load.
          </div>
        </div>
      </main>
    )
  }

  const availableMeals = meals?.filter((meal) => meal.isAvailable) || []

  return (
    <main className="min-h-screen p-4 sm:p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Event Details */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">{event.name}</h1>
          
          {event.description && (
            <p className="text-gray-600 mb-6">{event.description}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Date</h3>
              <p className="text-lg font-semibold">
                {new Date(event.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="text-sm text-gray-600">
                {new Date(event.date).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
            </div>

            {event.location && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Location</h3>
                <p className="text-lg font-semibold">{event.location}</p>
              </div>
            )}

            {event.maxGuests && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Maximum Capacity</h3>
                <p className="text-lg font-semibold">
                  {event.maxGuests} guests
                </p>
              </div>
            )}
          </div>

          <Link
            href="/menu"
            className="inline-block bg-[#D4AF37] text-white px-6 py-2 rounded-md hover:opacity-90"
          >
            Browse Menu for This Event
          </Link>
        </div>

        {/* Selectable Meals */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Available Meals for This Event</h2>
          
          {mealsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-200 rounded-lg h-80 animate-pulse"
                ></div>
              ))}
            </div>
          ) : availableMeals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {availableMeals.map((meal) => (
                <div key={meal.id} className="h-full min-h-0">
                  <MealCard meal={meal} />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg">No meals available at the moment.</p>
            </div>
          )}
        </div>

      </div>
    </main>
  )
}

