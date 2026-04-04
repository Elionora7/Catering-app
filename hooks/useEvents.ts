import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface Event {
  id: string
  name: string
  description: string | null
  date: string
  location: string | null
  maxGuests: number | null
  createdAt: string
  updatedAt: string
}

export interface EventInput {
  name: string
  description?: string
  date: Date | string
  location?: string
  maxGuests?: number
}

export function useEvents() {
  return useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: async () => {
      const response = await fetch('/api/events')
      if (!response.ok) {
        throw new Error('Failed to fetch events')
      }
      return response.json()
    },
  })
}

export function useEvent(id: string) {
  return useQuery<Event>({
    queryKey: ['events', id],
    queryFn: async () => {
      const response = await fetch(`/api/events/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch event')
      }
      return response.json()
    },
    enabled: !!id,
  })
}

export function useCreateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: EventInput) => {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create event')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

export function useUpdateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EventInput }) => {
      const response = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update event')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete event')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

