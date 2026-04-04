'use client'

import { useState } from 'react'
import { useMeals, useDeleteMeal, Meal } from '@/hooks/useMeals'
import Link from 'next/link'

export default function AdminMealsPage() {
  const { data: meals, isLoading } = useMeals()
  const deleteMeal = useDeleteMeal()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this meal?')) return

    setDeletingId(id)
    try {
      await deleteMeal.mutateAsync(id)
    } catch (error) {
      alert('Failed to delete meal')
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoading) {
    return (
      <main className="p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-48"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Manage Meals</h1>
          <Link
            href="/admin/meals/new"
            className="bg-[#D4AF37] text-white px-6 py-2 rounded-lg hover:opacity-90"
          >
            Add New Meal
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Meal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {meals && meals.length > 0 ? (
                meals.map((meal) => (
                  <tr key={meal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {meal.imageUrl ? (
                          <img
                            src={meal.imageUrl}
                            alt={meal.name}
                            className="h-12 w-12 rounded object-cover mr-4"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded bg-[#D4AF37] bg-opacity-20 flex items-center justify-center mr-4">
                            <span className="text-[#D4AF37] font-bold">
                              {meal.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {meal.name}
                          </div>
                          <div className="text-sm text-gray-500 line-clamp-1">
                            {meal.description || 'No description'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {meal.category || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        ${meal.price.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          meal.isAvailable
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {meal.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/meals/${meal.id}/edit`}
                        className="text-[#D4AF37] hover:opacity-80 mr-4"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(meal.id)}
                        disabled={deletingId === meal.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        {deletingId === meal.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No meals found. Create your first meal!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}





