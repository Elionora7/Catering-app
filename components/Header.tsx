'use client'

import Link from 'next/link'
import Image from 'next/image'

export function Header() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white shadow-md h-32 flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo-clear.png"
              alt="Catering App Logo"
              width={200}
              height={50}
              className="h-[50px] w-auto object-contain"
              priority
            />
          </Link>
        </div>
      </div>
    </header>
  )
}

