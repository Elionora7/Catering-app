import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface OrderItem {
  id: string
  mealId: string
  quantity: number
  price: number
  size?: string | null
  bainMarieFee?: number
  meal: {
    id: string
    name: string
    description: string | null
    imageUrl: string | null
  }
}

export interface Order {
  id: string
  userId: string
  status: string
  paymentMethod?: 'STRIPE' | 'BANK_TRANSFER'
  expiresAt?: string | null
  orderType: 'STANDARD' | 'EVENT'
  isEventConfirmed: boolean
  subtotal: number
  deliveryFee: number
  stripeFee?: number
  totalAmount: number
  depositAmount?: number
  remainingAmount?: number
  depositPaid?: boolean
  emailStatus?: string
  deliveryDate: string
  deliveryType: 'DELIVERY' | 'PICKUP'
  deliveryZone?: 'ZONE_1' | 'ZONE_2' | 'ZONE_3' | null
  postcode?: string | null
  allergiesNote?: string | null
  items: OrderItem[]
  user?: {
    id: string
    email: string
    name: string | null
  }
}

export function useOrders() {
  return useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await fetch('/api/orders', {
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }
      return response.json()
    },
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { 
      items: Array<{ mealId: string; quantity: number; size?: string | null; bainMarieFee?: number }>
      orderType: 'STANDARD' | 'EVENT'
      isEventConfirmed?: boolean
      deliveryDate: string | Date
      deliveryType: 'DELIVERY' | 'PICKUP'
      paymentMethod?: 'STRIPE' | 'BANK_TRANSFER'
      postcode?: string
      suburb?: string
      email?: string
      name?: string
      allergiesNote?: string
      stripeFee?: number
      totalAmount?: number
      phoneNumber?: string
      streetAddress?: string
      unitNumber?: string
      state?: string
      deliveryTime?: string
    }) => {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          items: data.items,
          orderType: data.orderType,
          isEventConfirmed: data.isEventConfirmed || false,
          deliveryDate: data.deliveryDate,
          deliveryType: data.deliveryType,
          paymentMethod: data.paymentMethod || 'STRIPE',
          postcode: data.postcode,
          suburb: data.suburb,
          email: data.email,
          name: data.name,
          allergiesNote: data.allergiesNote,
          stripeFee: data.stripeFee,
          totalAmount: data.totalAmount,
          phoneNumber: data.phoneNumber,
          streetAddress: data.streetAddress,
          unitNumber: data.unitNumber,
          state: data.state,
          deliveryTime: data.deliveryTime,
        }),
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        const msg = error.error || 'Failed to create order'
        const details = (error as { details?: unknown }).details
        const hint =
          Array.isArray(details) && details.length > 0
            ? ` ${JSON.stringify(details[0])}`
            : ''
        throw new Error(`${msg}${hint}`)
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      // Note: This assumes you have an API endpoint for updating order status
      // You may need to create /api/orders/[id]/route.ts with PUT method
      const response = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update order status')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

