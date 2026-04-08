'use client'

import {
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { useState, FormEvent, useEffect } from 'react'

interface StripeCardElementProps {
  onPaymentSuccess?: (paymentIntentId: string) => void
  onPaymentError?: (error: string) => void
  /** True while the parent form is submitting — disables inputs briefly */
  disabled?: boolean
  /** When true, the Pay button stays disabled (e.g. until allergy disclaimer is accepted). Card fields stay editable. */
  payDisabled?: boolean
  clientSecret?: string
  /** Name on card — required for billing_details; kept in sync with parent checkout state */
  cardholderName?: string
  onCardholderNameChange?: (value: string) => void
}

type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'diners' | 'jcb' | 'unionpay' | 'unknown'

const getCardBrandIcon = (brand: CardBrand): string => {
  const icons: Record<CardBrand, string> = {
    visa: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/visa.svg',
    mastercard: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/mastercard.svg',
    amex: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/americanexpress.svg',
    discover: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/discover.svg',
    diners: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/dinersclub.svg',
    jcb: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/jcb.svg',
    unionpay: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/unionpay.svg',
    unknown: '',
  }
  return icons[brand] || ''
}

export function StripeCardElement({
  onPaymentSuccess,
  onPaymentError,
  disabled = false,
  payDisabled = false,
  clientSecret,
  cardholderName,
  onCardholderNameChange,
}: StripeCardElementProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardBrand, setCardBrand] = useState<CardBrand>('unknown')
  const [cardComplete, setCardComplete] = useState(false)
  const [cardError, setCardError] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle')

  // Reset payment status when card details change (allows retry after failure)
  // Note: This useEffect is intentionally minimal to avoid hook order issues
  useEffect(() => {
    // Don't auto-reset, let user manually retry
    // This effect is kept for potential future use
  }, [cardComplete, cardError, paymentStatus])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const nameOnCard = cardholderName?.trim() ?? ''
    if (!nameOnCard) {
      const errorMessage = 'Please enter the cardholder name exactly as it appears on your card.'
      setError(errorMessage)
      setPaymentStatus('failed')
      onPaymentError?.(errorMessage)
      return
    }

    if (!stripe || !elements || !clientSecret) {
      const errorMessage = 'Payment system is not ready. Please try again.'
      setError(errorMessage)
      setPaymentStatus('failed')
      onPaymentError?.(errorMessage)
      setIsProcessing(false)
      return
    }

    // Reset previous error state when retrying
    if (paymentStatus === 'failed') {
      setError(null)
      setPaymentStatus('idle')
    }

    setIsProcessing(true)
    setError(null)
    setPaymentStatus('processing')

    try {
      // Get the card element
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        const errorMessage = 'Card element not found. Please refresh the page.'
        setError(errorMessage)
        setPaymentStatus('failed')
        onPaymentError?.(errorMessage)
        setIsProcessing(false)
        return
      }

      // Confirm card payment with cardholder name if provided
      // When using CardElement, we pass the element directly in payment_method.card
      const confirmParams: any = {
        payment_method: {
          card: cardElement,
        },
      }
      
      confirmParams.payment_method.billing_details = {
        name: nameOnCard,
      }

      console.log('Confirming payment with clientSecret:', clientSecret?.substring(0, 20) + '...')
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        confirmParams
      )

      console.log('Payment confirmation result:', {
        error: confirmError ? {
          type: confirmError.type,
          code: confirmError.code,
          message: confirmError.message,
        } : null,
        paymentIntent: paymentIntent ? {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
        } : null,
      })

      if (confirmError) {
        // Handle payment errors (declined cards, etc.)
        let errorMessage = 'Payment failed'
        
        // Provide user-friendly error messages based on error type
        if (confirmError.type === 'card_error') {
          switch (confirmError.code) {
            case 'card_declined':
              errorMessage = 'Your card was declined. Please try a different payment method or contact your bank.'
              break
            case 'insufficient_funds':
              errorMessage = 'Insufficient funds. Please use a different payment method.'
              break
            case 'expired_card':
              errorMessage = 'Your card has expired. Please use a different card.'
              break
            case 'incorrect_cvc':
              errorMessage = 'Your card\'s security code is incorrect. Please check and try again.'
              break
            case 'incorrect_number':
              errorMessage = 'Your card number is incorrect. Please check and try again.'
              break
            case 'processing_error':
              errorMessage = 'An error occurred while processing your card. Please try again.'
              break
            default:
              errorMessage = confirmError.message || 'Your card was declined. Please try a different payment method.'
          }
        } else if (confirmError.type === 'validation_error') {
          errorMessage = 'Please check your card details and try again.'
        } else {
          errorMessage = confirmError.message || 'Payment failed. Please try again.'
        }
        
        setError(errorMessage)
        setPaymentStatus('failed')
        onPaymentError?.(errorMessage)
        setIsProcessing(false)
        return
      }

      // Verify payment intent status
      if (!paymentIntent) {
        const errorMessage = 'Payment confirmation failed. Please try again.'
        setError(errorMessage)
        setPaymentStatus('failed')
        onPaymentError?.(errorMessage)
        setIsProcessing(false)
        return
      }

      // Check if payment actually succeeded
      if (paymentIntent.status === 'succeeded') {
        // Payment succeeded
        console.log('Payment succeeded! Payment Intent ID:', paymentIntent.id)
        setPaymentStatus('success')
        setError(null)
        onPaymentSuccess?.(paymentIntent.id)
      } else if (paymentIntent.status === 'processing') {
        // Payment is processing (3D Secure or similar)
        console.log('Payment is processing. Payment Intent ID:', paymentIntent.id)
        setPaymentStatus('processing')
        setError('Your payment is being processed. Please wait...')
        // Wait a moment and check status again
        setTimeout(async () => {
          try {
            const { paymentIntent: updatedIntent } = await stripe.retrievePaymentIntent(clientSecret)
            if (updatedIntent?.status === 'succeeded') {
              setPaymentStatus('success')
              setError(null)
              onPaymentSuccess?.(updatedIntent.id)
            } else if (updatedIntent?.status === 'requires_payment_method' || updatedIntent?.status === 'canceled') {
              setPaymentStatus('failed')
              setError('Payment was not successful. Please try again.')
              onPaymentError?.('Payment was not successful. Please try again.')
            }
          } catch (err) {
            console.error('Error checking payment status:', err)
            setPaymentStatus('failed')
            setError('Error checking payment status. Please contact support.')
            onPaymentError?.('Error checking payment status. Please contact support.')
          }
        }, 2000)
      } else {
        // Payment did not succeed
        let errorMessage = 'Payment was not successful.'
        if (paymentIntent.status === 'requires_payment_method') {
          errorMessage = 'Payment requires a valid payment method. Please try again with a different card.'
        } else if (paymentIntent.status === 'requires_confirmation') {
          errorMessage = 'Payment requires confirmation. Please try again.'
        } else if (paymentIntent.status === 'requires_action') {
          errorMessage = 'Payment requires additional action. Please complete the authentication.'
        } else if (paymentIntent.status === 'canceled') {
          errorMessage = 'Payment was canceled. Please try again.'
        } else {
          errorMessage = `Payment status: ${paymentIntent.status}. Payment was not successful.`
        }
        console.error('Payment failed with status:', paymentIntent.status, 'Payment Intent ID:', paymentIntent.id)
        setError(errorMessage)
        setPaymentStatus('failed')
        onPaymentError?.(errorMessage)
        setIsProcessing(false)
        return
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred. Please try again.'
      setError(errorMessage)
      setPaymentStatus('failed')
      onPaymentError?.(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle card element changes
  useEffect(() => {
    if (!elements) return

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) return

    const handleChange = (event: any) => {
      if (event.brand) {
        setCardBrand(event.brand as CardBrand)
      }
      setCardComplete(event.complete || false)
      if (event.error) {
        setCardError(event.error.message)
      } else {
        setCardError(null)
      }
    }

    cardElement.on('change', handleChange)
    return () => {
      cardElement.off('change', handleChange)
    }
  }, [elements])

  return (
    <div className="space-y-4">
      {/* Card Brand Icons */}
      <div className="flex items-center justify-end space-x-2 mb-2">
        {cardBrand !== 'unknown' && getCardBrandIcon(cardBrand) ? (
          <img 
            src={getCardBrandIcon(cardBrand)} 
            alt={cardBrand} 
            className="h-6 w-10 object-contain transition-opacity"
          />
        ) : (
          <div className="flex items-center space-x-1">
            <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/visa.svg" alt="Visa" className="h-5 w-8 object-contain opacity-30" />
            <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/mastercard.svg" alt="Mastercard" className="h-5 w-8 object-contain opacity-30" />
            <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/americanexpress.svg" alt="Amex" className="h-5 w-8 object-contain opacity-30" />
          </div>
        )}
      </div>

      {/* Card Input Field */}
      <div className={`p-4 bg-white rounded-lg border-2 transition-colors ${
        cardError 
          ? 'border-red-300 bg-red-50' 
          : cardComplete 
          ? 'border-green-300 bg-green-50' 
          : 'border-gray-300'
      }`}>
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Card Number, Expiry, and CVC
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Enter your card details securely. All fields are encrypted and PCI compliant.
          </p>
        </div>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#0F3D3E',
                fontFamily: 'Inter, system-ui, sans-serif',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#df1b41',
                iconColor: '#df1b41',
              },
            },
            hidePostalCode: true,
          }}
        />
        {cardError && (
          <p className="text-xs text-red-600 mt-2 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {cardError}
          </p>
        )}
        {cardComplete && !cardError && (
          <p className="text-xs text-green-600 mt-2 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Card details valid
          </p>
        )}
      </div>

      <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
        <label htmlFor="stripe-cardholder-name" className="block text-sm font-medium text-gray-700 mb-2">
          Cardholder name <span className="text-red-600">*</span>
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Use the name printed on the card (required for verification — not the card number field above).
        </p>
        <input
          id="stripe-cardholder-name"
          type="text"
          name="cardholderName"
          autoComplete="cc-name"
          value={cardholderName ?? ''}
          onChange={(e) => onCardholderNameChange?.(e.target.value)}
          disabled={disabled}
          maxLength={80}
          className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          placeholder="Name as shown on card"
        />
      </div>

      {paymentStatus === 'success' && (
        <div className="bg-green-50 border-2 border-green-500 text-green-800 px-4 py-3 rounded-lg text-sm font-medium flex items-center">
          <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Payment successful! Processing your order...</span>
        </div>
      )}

      {error && paymentStatus === 'failed' && (
        <div className="bg-red-50 border-2 border-red-500 text-red-800 px-4 py-3 rounded-lg text-sm font-medium">
          <div className="flex items-start">
            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold mb-1">Payment Failed</p>
              <p>{error}</p>
              <p className="mt-2 text-xs text-red-600">Please check your card details and try again, or use a different payment method.</p>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={
          !stripe ||
          !elements ||
          isProcessing ||
          disabled ||
          payDisabled ||
          !cardComplete ||
          !!cardError ||
          !(cardholderName && cardholderName.trim()) ||
          paymentStatus === 'success'
        }
        className={`w-full px-6 py-3 rounded-md font-semibold shadow-md transition-all ${
          paymentStatus === 'success'
            ? 'bg-green-500 text-white cursor-not-allowed'
            : paymentStatus === 'failed'
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'bg-[#D4AF37] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'
        }`}
      >
        {isProcessing || paymentStatus === 'processing' ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing Payment...
          </span>
        ) : paymentStatus === 'success' ? (
          <span className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Payment Successful
          </span>
        ) : paymentStatus === 'failed' ? (
          <span className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Try Payment Again
          </span>
        ) : (
          'Pay Now'
        )}
      </button>
    </div>
  )
}


