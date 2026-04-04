'use client'

import Link from 'next/link'

export function BookingWidgetMobile() {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0F3D3E] border-t-2 border-[#D4AF37] p-3 shadow-2xl">
      <Link
        href="/menu"
        className="block w-full px-6 py-3 bg-[#D4AF37] text-[#0F3D3E] font-bold rounded-lg hover:bg-[#c9a030] transition-all duration-200 text-center"
      >
        View Menu
      </Link>
    </div>
  )
}


