'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export function BookingWidget() {
  const router = useRouter()
  const [date, setDate] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Navigate to menu page
    router.push('/menu')
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 hidden lg:block">
      <div className="bg-[#0F3D3E] border-2 border-[#D4AF37] rounded-lg p-6 shadow-2xl max-w-sm w-80">
        <h3 className="text-xl font-bold text-[#D4AF37] mb-4 font-playfair">
          Quick Booking
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <button
            type="submit"
            className="w-full py-3 bg-[#D4AF37] text-[#0F3D3E] font-bold rounded hover:bg-[#c9a030] transition-all duration-200"
          >
            Browse Menu
          </button>
        </form>

        <Link
          href="/menu"
          className="block text-center text-[#D4AF37] text-sm mt-4 hover:underline"
        >
          View Full Menu
        </Link>
      </div>
    </div>
  )
}


