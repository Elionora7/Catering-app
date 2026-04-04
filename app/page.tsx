'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { HeroSection } from '@/components/HeroSection'
import { HomeMenuCategories } from '@/components/HomeMenuCategories'
import { HowCateringWorks } from '@/components/HowCateringWorks'
import { CateringHighlights } from '@/components/CateringHighlights'
import { LargeEventCTA } from '@/components/LargeEventCTA'

function HomeContent() {
  const searchParams = useSearchParams()
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    const success = searchParams?.get('success')
    
    if (success === 'true') {
      setShowSuccess(true)
      setSuccessMessage('Your order has been placed successfully! A confirmation email has been sent to your email address.')
      
      // Hide success message after 10 seconds
      const timer = setTimeout(() => {
        setShowSuccess(false)
        // Clean up URL
        window.history.replaceState({}, '', '/')
      }, 10000)
      
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  return (
    <main className="min-h-screen bg-gray-50">
      {showSuccess && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
          <div className="flex items-center max-w-7xl mx-auto">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700 font-medium">{successMessage}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => {
                  setShowSuccess(false)
                  window.history.replaceState({}, '', '/')
                }}
                className="text-green-500 hover:text-green-700"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      <HeroSection />
      <HomeMenuCategories />
      <HowCateringWorks />
      <CateringHighlights />
      <LargeEventCTA />
    </main>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50">
        <HeroSection />
        <HomeMenuCategories />
        <HowCateringWorks />
        <CateringHighlights />
        <LargeEventCTA />
      </main>
    }>
      <HomeContent />
    </Suspense>
  )
}
