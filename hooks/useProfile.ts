import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

export interface UserProfile {
  id: string
  userId: string
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  postcode: string | null
  country: string | null
  createdAt: string
  updatedAt: string
}

export interface UserProfileInput {
  phone: string
  address: string
  city: string
  state: string
  postcode: string
  country?: string
}

export function useProfile() {
  const { data: session } = useSession()

  return useQuery<UserProfile | null>({
    queryKey: ['profile', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null

      try {
        const response = await fetch('/api/profile', {
          credentials: 'include',
        })

        if (!response.ok) {
          // Don't throw error for 500s - just return null
          // This prevents the checkout page from breaking if profile API fails
          if (response.status === 500) {
            console.warn('Profile API returned 500, continuing without profile data')
            return null
          }
          throw new Error('Failed to fetch profile')
        }

        return response.json()
      } catch (error) {
        // Log error but don't break the app
        console.error('Error fetching profile:', error)
        return null
      }
    },
    enabled: !!session?.user?.id,
    retry: false, // Don't retry on failure
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()

  return useMutation({
    mutationFn: async (data: UserProfileInput) => {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        // If there are validation details, include them in the error message
        if (error.details && Array.isArray(error.details)) {
          const validationErrors = error.details
            .map((err: any) => `${err.path.join('.')}: ${err.message}`)
            .join(', ')
          throw new Error(validationErrors || error.error || 'Failed to save profile')
        }
        throw new Error(error.error || 'Failed to save profile')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', session?.user?.id] })
    },
  })
}


