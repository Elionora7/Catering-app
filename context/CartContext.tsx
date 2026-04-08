'use client'

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Meal } from '@/hooks/useMeals'
import { getMealMinimumQuantity } from '@/lib/categoryMinimums'
import { isBbqBainMarieEligibleMeal, shouldChargeBainMarieServiceFee } from '@/lib/dipTrayCombo'
import { clearQuoteRequestContextFromSession } from '@/lib/quoteRequestContext'

export interface CartItem {
  mealId: string
  meal: Meal
  quantity: number
  size?: 'SMALL' | 'MEDIUM' | 'LARGE' | 'BAIN_MARIE' | null
  bainMarieFee?: number // Food warmer add-on fee per tray ($55); internal field name unchanged
}

interface CartContextType {
  items: CartItem[]
  /** Shown once when stale lines were dropped (wrong meal id / unpublished on server). */
  cartSyncNotice: string | null
  dismissCartSyncNotice: () => void
  addItem: (meal: Meal, quantity?: number, size?: 'SMALL' | 'MEDIUM' | 'LARGE' | 'BAIN_MARIE' | null) => void
  removeItem: (mealId: string, size?: 'SMALL' | 'MEDIUM' | 'LARGE' | 'BAIN_MARIE' | null) => void
  updateQuantity: (mealId: string, quantity: number, size?: 'SMALL' | 'MEDIUM' | 'LARGE' | 'BAIN_MARIE' | null) => void
  updateItemSize: (mealId: string, size: 'SMALL' | 'MEDIUM' | 'LARGE' | 'BAIN_MARIE' | null) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = 'catering-app-cart'

function getItemKey(mealId: string, size?: 'SMALL' | 'MEDIUM' | 'LARGE' | 'BAIN_MARIE' | null) {
  return `${mealId}:${size ?? 'NONE'}`
}

function usesSizeVariant(meal: Meal) {
  return meal.pricingType === 'SIZED' || isBbqBainMarieEligibleMeal(meal)
}

/** Drop cart lines whose meal ids are not in the current menu (available), refresh meal snapshots. */
async function sanitizeCartWithMenu(
  rawItems: CartItem[]
): Promise<{ items: CartItem[]; dropped: number }> {
  if (rawItems.length === 0) return { items: [], dropped: 0 }
  try {
    const res = await fetch('/api/meals')
    if (!res.ok) return { items: rawItems, dropped: 0 }
    const meals: Meal[] = await res.json()
    const available = meals.filter((m) => m.isAvailable)
    const mealById = new Map(available.map((m) => [m.id, m]))
    const next: CartItem[] = []
    for (const item of rawItems) {
      if (!item?.mealId) continue
      const fresh = mealById.get(item.mealId)
      if (!fresh) continue
      const minQty = getMealMinimumQuantity(fresh)
      const qty = typeof item.quantity === 'number' ? item.quantity : 0
      const quantity = qty > 0 && qty < minQty ? minQty : qty
      next.push({
        ...item,
        meal: fresh,
        quantity,
      })
    }
    return { items: next, dropped: rawItems.length - next.length }
  } catch {
    return { items: rawItems, dropped: 0 }
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [cartSyncNotice, setCartSyncNotice] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const { data: session } = useSession()
  const previousSessionRef = useRef<typeof session>(null)

  const dismissCartSyncNotice = () => setCartSyncNotice(null)

  // Load cart from localStorage on mount, then validate ids against live /api/meals (same rules as checkout).
  useEffect(() => {
    if (typeof window === 'undefined') return

    const run = async () => {
      try {
        const savedCart = localStorage.getItem(CART_STORAGE_KEY)
        if (!savedCart) {
          setIsHydrated(true)
          return
        }
        const parsed = JSON.parse(savedCart)
        if (!Array.isArray(parsed)) {
          setIsHydrated(true)
          return
        }
        const normalized = parsed
          .filter(Boolean)
          .map((item: any) => {
            const meal = item?.meal as Meal | undefined
            if (!meal) return item
            const minQty = getMealMinimumQuantity(meal)
            const qty = typeof item.quantity === 'number' ? item.quantity : 0
            return {
              ...item,
              quantity: qty > 0 && qty < minQty ? minQty : qty,
            }
          }) as CartItem[]

        const { items: cleaned, dropped } = await sanitizeCartWithMenu(normalized)
        if (dropped > 0) {
          console.warn(
            `[Cart] Removed ${dropped} cart line(s): meal id(s) not in current menu or unavailable.`
          )
          setCartSyncNotice(
            dropped === 1
              ? 'One item was removed from your cart — it is no longer on the menu.'
              : `${dropped} items were removed from your cart — they are no longer on the menu.`
          )
        }
        setItems(cleaned)
      } catch (error) {
        console.error('Failed to load cart from localStorage', error)
        localStorage.removeItem(CART_STORAGE_KEY)
      } finally {
        setIsHydrated(true)
      }
    }

    void run()
  }, [])

  // Watch for login/logout events to ensure cart persistence
  useEffect(() => {
    const wasLoggedOut = previousSessionRef.current === null
    const isNowLoggedIn = session !== null && session !== undefined

    // When user logs in, ensure cart persists from localStorage
    if (wasLoggedOut && isNowLoggedIn && isHydrated) {
      void (async () => {
        try {
          const savedCart = localStorage.getItem(CART_STORAGE_KEY)
          if (!savedCart) return
          const parsed = JSON.parse(savedCart)
          if (!Array.isArray(parsed) || parsed.length === 0) return
          const { items: cleaned, dropped } = await sanitizeCartWithMenu(parsed as CartItem[])
          if (dropped > 0) {
            setCartSyncNotice(
              dropped === 1
                ? 'One item was removed from your cart — it is no longer on the menu.'
                : `${dropped} items were removed from your cart — they are no longer on the menu.`
            )
          }
          setItems(cleaned)
        } catch (error) {
          console.error('Failed to sync cart on login', error)
        }
      })()
    }

    // Update previous session ref
    previousSessionRef.current = session
  }, [session, isHydrated])

  // Save cart to localStorage whenever it changes (client-side only, after hydration)
  // This ensures cart persists across page navigation and browser refreshes
  useEffect(() => {
    if (typeof window !== 'undefined' && isHydrated) {
      try {
        if (items.length > 0) {
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
        } else {
          // Clear localStorage if cart is empty (optional - you might want to keep empty cart)
          // localStorage.removeItem(CART_STORAGE_KEY)
        }
      } catch (error) {
        console.error('Failed to save cart to localStorage', error)
      }
    }
  }, [items, isHydrated])

  // Keep quote-request session snapshot in sync: no cart rows → no stale line items on /request-quote
  useEffect(() => {
    if (typeof window === 'undefined' || !isHydrated) return
    if (items.length === 0) {
      clearQuoteRequestContextFromSession()
    }
  }, [items.length, isHydrated])

  const addItem = (meal: Meal, quantity: number = 1, size: 'SMALL' | 'MEDIUM' | 'LARGE' | 'BAIN_MARIE' | null = null) => {
    setItems((prevItems) => {
      const minQty = getMealMinimumQuantity(meal)
      const safeQty = Math.max(quantity, 0)
      // For sized items, check if same meal with same size exists
      const existingItem = prevItems.find((item) => {
        if (item.mealId === meal.id) {
          // For size-based items and BBQ warmer variants, match by size.
          if (usesSizeVariant(meal)) {
            return item.size === size
          }
          return true // For non-sized items, match by mealId only
        }
        return false
      })

      if (existingItem) {
        return prevItems.map((item) =>
          item.mealId === meal.id && (!usesSizeVariant(meal) || item.size === size)
            ? { ...item, quantity: item.quantity + safeQty }
            : item
        )
      }
      
      const bainMarieFee = shouldChargeBainMarieServiceFee(meal, size) ? 55 : 0
      
      const initialQty = safeQty === 0 ? 0 : Math.max(safeQty, minQty)
      return [...prevItems, { mealId: meal.id, meal, quantity: initialQty, size, bainMarieFee }]
    })
  }

  const removeItem = (mealId: string, size: 'SMALL' | 'MEDIUM' | 'LARGE' | 'BAIN_MARIE' | null = null) => {
    setItems((prevItems) => {
      return prevItems.filter((item) => {
        // For sized meals, remove only the matching size line
        if (item.meal.pricingType === 'SIZED') {
          return getItemKey(item.mealId, item.size ?? null) !== getItemKey(mealId, size)
        }
        if (usesSizeVariant(item.meal)) {
          return getItemKey(item.mealId, item.size ?? null) !== getItemKey(mealId, size)
        }
        return item.mealId !== mealId
      })
    })
  }

  const updateQuantity = (mealId: string, quantity: number, size: 'SMALL' | 'MEDIUM' | 'LARGE' | 'BAIN_MARIE' | null = null) => {
    setItems((prevItems) => {
      const next = prevItems.map((item) => {
        const isTarget =
          item.mealId === mealId &&
          (!usesSizeVariant(item.meal) || getItemKey(item.mealId, item.size ?? null) === getItemKey(mealId, size))

        if (!isTarget) return item

        if (quantity <= 0) {
          return { ...item, quantity: 0 }
        }

        const minQty = getMealMinimumQuantity(item.meal)
        return { ...item, quantity: quantity < minQty ? minQty : quantity }
      })

      // Remove any zero-quantity items after mapping
      return next.filter((item) => item.quantity > 0)
    })
  }

  const updateItemSize = (mealId: string, size: 'SMALL' | 'MEDIUM' | 'LARGE' | 'BAIN_MARIE' | null) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.mealId === mealId) {
          const bainMarieFee = shouldChargeBainMarieServiceFee(item.meal, size) ? 55 : 0
          return { ...item, size, bainMarieFee }
        }
        return item
      })
    )
  }

  const clearCart = () => {
    setItems([])
    setCartSyncNotice(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CART_STORAGE_KEY)
      clearQuoteRequestContextFromSession()
    }
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => {
    let itemPrice = item.meal.price
    
    // Calculate price based on size for SIZED items
    if (item.meal.pricingType === 'SIZED' && item.size) {
      if (item.size === 'SMALL' && item.meal.priceSmall) {
        itemPrice = item.meal.priceSmall
      } else if (item.size === 'MEDIUM' && item.meal.priceMedium) {
        itemPrice = item.meal.priceMedium
      } else if (item.size === 'LARGE' && item.meal.priceLarge) {
        itemPrice = item.meal.priceLarge
      } else if (item.size === 'BAIN_MARIE' && item.meal.priceBainMarie) {
        itemPrice = item.meal.priceBainMarie
      }
    }
    
    // Add food warmer fee per tray (stored as bainMarieFee)
    const bainMarieFee = item.bainMarieFee || 0
    
    return sum + (itemPrice * item.quantity) + (bainMarieFee * item.quantity)
  }, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        cartSyncNotice,
        dismissCartSyncNotice,
        addItem,
        removeItem,
        updateQuantity,
        updateItemSize,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}



