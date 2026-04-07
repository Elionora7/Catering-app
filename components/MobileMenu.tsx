'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useCart } from '@/context/CartContext'
import { SocialMediaLinks } from '@/components/SocialMediaLinks'

export function MobileMenu({ scrolled = false }: { scrolled?: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const { data: session } = useSession()
  const { totalItems } = useCart()

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`md:hidden inline-flex items-center gap-1.5 px-2 py-2 rounded-md transition-colors font-semibold text-sm ${
          scrolled
            ? 'text-[#D4AF37] hover:bg-[#D4AF37]/10'
            : 'text-[#0F3D3E] hover:bg-[#0F3D3E]/10'
        }`}
        aria-label="Toggle menu"
      >
        <span>Menu</span>
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsOpen(false)}>
          <div className="bg-[#FFF9EB] w-64 h-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-[#D4AF37]">Menu</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-md text-[#D4AF37] hover:bg-cream-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <nav className="p-4 space-y-2">
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-[#0F3D3E] hover:bg-[#D4AF37]/20 rounded-md font-medium transition-colors"
              >
                Home
              </Link>
              <Link
                href="/menu"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-[#0F3D3E] hover:bg-[#D4AF37]/20 rounded-md font-medium transition-colors"
              >
                Menu
              </Link>
              <Link
                href="/service-areas"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-[#0F3D3E] hover:bg-[#D4AF37]/20 rounded-md font-medium transition-colors"
              >
                Service Areas
              </Link>
              <Link
                href="/request-quote"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-[#0F3D3E] hover:bg-[#D4AF37]/20 rounded-md font-medium transition-colors"
              >
                Request Quote
              </Link>
              <Link
                href="/contact"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-[#0F3D3E] hover:bg-[#D4AF37]/20 rounded-md font-medium transition-colors"
              >
                Contact
              </Link>
              <Link
                href="/cart"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-[#D4AF37] hover:bg-cream-200 rounded-md flex items-center justify-between font-medium"
              >
                <span>Cart</span>
                {totalItems > 0 && (
                  <span className="bg-[#D4AF37] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>
              {session && session.user.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2 text-[#0F3D3E] hover:bg-[#D4AF37]/20 rounded-md font-medium transition-colors"
                >
                  Admin
                </Link>
              )}
              <div className="px-4 pt-4 mt-2 border-t border-[#D4AF37]/25">
                <SocialMediaLinks linkClassName="text-[#D4AF37] hover:text-[#0F3D3E]" iconSizeClassName="w-7 h-7" />
              </div>
              {session && (
                <div className="pt-4 border-t">
                  <div className="px-4 py-2 text-sm text-[#D4AF37]">
                    {session.user.name || session.user.email}
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-2 text-[#0F3D3E] hover:bg-[#D4AF37]/20 rounded-md font-medium transition-colors"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      signOut()
                    }}
                    className="w-full text-left px-4 py-2 text-[#D4AF37] hover:bg-cream-200 rounded-md font-medium"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}



