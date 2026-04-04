'use client'

import { loadStripe, StripeElementsOptions, Stripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { ReactNode, useMemo, useState, useEffect } from 'react'

// Lazy load Stripe - only load when needed
let stripePromise: Promise<Stripe | null> | null = null

const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    if (!publishableKey) {
      // Return a rejected promise if no key is set
      stripePromise = Promise.resolve(null)
    } else {
      stripePromise = loadStripe(publishableKey).catch((error) => {
        console.error('Failed to load Stripe:', error)
        return null
      })
    }
  }
  return stripePromise
}

interface StripeProviderProps {
  children: ReactNode
  clientSecret?: string
  amount?: number
}

export function StripeProvider({ children, clientSecret }: StripeProviderProps) {
  const [stripe, setStripe] = useState<Stripe | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!clientSecret) {
      setIsLoading(false)
      return
    }

    // Load Stripe when clientSecret is available
    getStripe()
      .then((stripeInstance) => {
        if (!stripeInstance) {
          setError('Stripe failed to load. Please check your configuration.')
        }
        setStripe(stripeInstance)
      })
      .catch((err) => {
        console.error('Error loading Stripe:', err)
        setError('Failed to initialize payment. Please try again.')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [clientSecret])

  const options: StripeElementsOptions = useMemo(() => ({
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#D4AF37',
        colorBackground: '#ffffff',
        colorText: '#0F3D3E',
        colorDanger: '#df1b41',
        fontFamily: 'Inter, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
    locale: 'en',
  }), [clientSecret])

  if (!clientSecret) {
    return <>{children}</>
  }

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#D4AF37] mx-auto"></div>
        <p className="text-sm text-gray-600 mt-2">Loading payment form...</p>
      </div>
    )
  }

  if (error || !stripe) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          {error || 'Payment system is temporarily unavailable. Please use an alternative payment method.'}
        </p>
      </div>
    )
  }

  return (
    <Elements options={options} stripe={stripe}>
      {children}
    </Elements>
  )
}

