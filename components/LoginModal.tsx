'use client'

import Link from 'next/link'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  redirectUrl?: string
}

export function LoginModal({ isOpen, onClose, redirectUrl = '/checkout' }: LoginModalProps) {
  if (!isOpen) return null

  const loginUrl = `/auth/login?redirect=${encodeURIComponent(redirectUrl)}`
  const registerUrl = `/auth/register?redirect=${encodeURIComponent(redirectUrl)}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 z-10">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-[#D4AF37]">
            Login Required
          </h2>
          <button
            onClick={onClose}
            className="text-[#D4AF37] hover:opacity-70 transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          You need to log in or create an account to place an order. Your cart and information will be saved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={loginUrl}
            className="flex-1 px-6 py-3 bg-[#D4AF37] text-white rounded-md hover:opacity-90 text-center font-medium transition-colors"
          >
            Login
          </Link>
          <Link
            href={registerUrl}
            className="flex-1 px-6 py-3 border-2 border-[#D4AF37] text-[#D4AF37] rounded-md hover:bg-cream-100 text-center font-medium transition-colors"
          >
            Register
          </Link>
        </div>

        <button
          onClick={onClose}
          className="mt-4 text-sm text-[#D4AF37] hover:opacity-80 w-full"
        >
          Continue as guest (cart will be saved)
        </button>
      </div>
    </div>
  )
}



