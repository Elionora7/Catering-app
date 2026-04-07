'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { useCart } from '@/context/CartContext'
import { MobileMenu } from './MobileMenu'
import { SocialMediaLinks } from '@/components/SocialMediaLinks'

export function Navbar() {
  const { data: session } = useSession()
  const { totalItems } = useCart()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-24 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0F3D3E] shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full">
          <div className="flex items-center space-x-4 sm:space-x-8">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo-clear.png"
                alt="Eliora Signature Catering Logo"
                width={scrolled ? 160 : 200}
                height={scrolled ? 45 : 55}
                className="h-auto object-contain transition-all duration-300"
              />
            </Link>
            <div className="hidden md:flex space-x-1">
              <NavLink href="/menu" scrolled={scrolled}>Menu</NavLink>
              <NavLink href="/service-areas" scrolled={scrolled}>Service Areas</NavLink>
              <NavLink href="/request-quote" scrolled={scrolled}>Request Quote</NavLink>
              <NavLink href="/contact" scrolled={scrolled}>Contact</NavLink>
              <NavLink href="/cart" scrolled={scrolled} badge={totalItems}>
                <span className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m14-9l2 9m-5-9v9m-4-9v9" />
                  </svg>
                  Cart
                </span>
              </NavLink>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link
              href="/cart"
              className={`md:hidden relative inline-flex items-center justify-center p-2 rounded-md transition-colors ${
                scrolled
                  ? 'text-white hover:text-[#D4AF37] hover:bg-white/10'
                  : 'text-[#0F3D3E] hover:text-[#D4AF37] hover:bg-[#0F3D3E]/10'
              }`}
              aria-label="Open cart"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m14-9l2 9m-5-9v9m-4-9v9" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-[#0F3D3E] text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </Link>
            <div className="md:hidden">
              <MobileMenu scrolled={scrolled} />
            </div>
            <div className="hidden md:block">
              <SocialMediaLinks
                linkClassName={
                  scrolled
                    ? 'text-white hover:text-[#D4AF37]'
                    : 'text-[#0F3D3E] hover:text-[#D4AF37]'
                }
              />
            </div>
            {session?.user ? (
              <>
                {session.user.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className={`hidden sm:block px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      scrolled
                        ? 'text-white hover:text-[#D4AF37]'
                        : 'text-[#0F3D3E] hover:text-[#D4AF37]'
                    }`}
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/profile"
                  className={`hidden sm:block px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    scrolled ? 'text-white hover:text-[#D4AF37]' : 'text-[#0F3D3E] hover:text-[#D4AF37]'
                  }`}
                >
                  Profile
                </Link>
                <span
                  className={`hidden sm:block text-sm truncate max-w-[100px] lg:max-w-none ${
                    scrolled ? 'text-white' : 'text-[#0F3D3E]'
                  }`}
                >
                  {session.user.name || session.user.email}
                </span>
                <button
                  onClick={() => signOut()}
                  className="bg-[#D4AF37] hover:bg-[#c9a030] text-[#0F3D3E] px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 hover:scale-105"
                >
                  <span className="hidden sm:inline">Sign Out</span>
                  <span className="sm:hidden">Out</span>
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  )
}

function NavLink({ 
  href, 
  children, 
  scrolled, 
  badge 
}: { 
  href: string
  children: React.ReactNode
  scrolled: boolean
  badge?: number
}) {
  return (
    <Link
      href={href}
      className={`relative px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 group ${
        scrolled
          ? 'text-white hover:text-[#D4AF37]'
          : 'text-[#0F3D3E] hover:text-[#D4AF37]'
      }`}
    >
      <span className="relative">
        {children}
        {badge && badge > 0 && (
          <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-[#0F3D3E] text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {badge}
          </span>
        )}
      </span>
      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#D4AF37] group-hover:w-full transition-all duration-300" />
    </Link>
  )
}
