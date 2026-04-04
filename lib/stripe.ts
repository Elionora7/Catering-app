import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

// Validate Stripe key format (should start with sk_)
const stripeKey = process.env.STRIPE_SECRET_KEY
if (!stripeKey.startsWith('sk_')) {
  console.warn('Warning: STRIPE_SECRET_KEY does not appear to be a valid Stripe secret key (should start with sk_)')
}

export const stripe = new Stripe(stripeKey, {
  apiVersion: '2025-11-17.clover',
  typescript: true,
})

// Get Stripe publishable key for client-side
export const getStripePublishableKey = () => {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
}


