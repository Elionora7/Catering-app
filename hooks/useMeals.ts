import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface Meal {
  id: string
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  category: string | null
  isAvailable: boolean
  mealType: 'DAILY' | 'EVENT' | 'BOTH'
  pricingType: 'PER_ITEM' | 'PER_DOZEN' | 'PER_PERSON' | 'PER_SKEWER' | 'SIZED'
  priceSmall?: number | null
  priceMedium?: number | null
  priceLarge?: number | null
  priceBainMarie?: number | null
  minimumQuantity?: number | null
  isNDISReady: boolean
  createdAt: string
  updatedAt: string
}

export interface MealInput {
  name: string
  description?: string
  price: number
  imageUrl?: string
  category?: string
  isAvailable?: boolean
  mealType?: 'DAILY' | 'EVENT' | 'BOTH'
  isNDISReady?: boolean
}

export function useMeals() {
  return useQuery<Meal[]>({
    queryKey: ['meals'],
    queryFn: async () => {
      const response = await fetch('/api/meals')
      if (!response.ok) {
        throw new Error('Failed to fetch meals')
      }
      return response.json()
    },
  })
}

export function useDailyMeals() {
  return useQuery<Meal[]>({
    queryKey: ['meals', 'daily'],
    queryFn: async () => {
      const response = await fetch('/api/meals?type=daily')
      if (!response.ok) {
        throw new Error('Failed to fetch daily meals')
      }
      return response.json()
    },
  })
}

export function useEventMeals() {
  return useQuery<Meal[]>({
    queryKey: ['meals', 'event'],
    queryFn: async () => {
      const response = await fetch('/api/meals?type=event')
      if (!response.ok) {
        throw new Error('Failed to fetch event meals')
      }
      return response.json()
    },
  })
}

export function useMeal(id: string) {
  return useQuery<Meal>({
    queryKey: ['meals', id],
    queryFn: async () => {
      const response = await fetch(`/api/meals/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch meal')
      }
      return response.json()
    },
    enabled: !!id,
  })
}

export function useCreateMeal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: MealInput) => {
      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create meal')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] })
    },
  })
}

export function useUpdateMeal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: MealInput }) => {
      const response = await fetch(`/api/meals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update meal')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] })
    },
  })
}

export function useDeleteMeal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/meals/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete meal')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] })
    },
  })
}

