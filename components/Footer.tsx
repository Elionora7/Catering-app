'use client'

import Link from 'next/link'
import Image from 'next/image'
import { SocialMediaLinks } from '@/components/SocialMediaLinks'

export function Footer() {
  return (
    <footer className="relative z-20 bg-[#0F3D3E] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <Image
              src="/logo-clear.png"
              alt="Eliora Signature Catering"
              width={180}
              height={50}
              className="h-12 w-auto object-contain mb-4 brightness-0 invert"
            />
            <p className="text-white/70 text-sm mb-4">
              Authentic Lebanese Catering in Sydney
            </p>
            <SocialMediaLinks linkClassName="text-[#D4AF37] hover:text-white" />
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-[#D4AF37] font-semibold mb-4 font-playfair">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/menu" className="text-white/70 hover:text-[#D4AF37] transition-colors">
                  Menu
                </Link>
              </li>
              <li>
                <Link href="/request-quote" className="text-white/70 hover:text-[#D4AF37] transition-colors">
                  Request Quote
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-white/70 hover:text-[#D4AF37] transition-colors">
                  Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* Service Areas */}
          <div>
            <h3 className="text-[#D4AF37] font-semibold mb-4 font-playfair">Service Areas</h3>
            <ul className="space-y-2 text-white/70 text-sm">
              <li>
                <Link href="/service-areas" className="hover:text-[#D4AF37] transition-colors">
                  View All Service Areas
                </Link>
              </li>
              <li>Bankstown</li>
              <li>Parramatta</li>
              <li>Inner West Sydney</li>
              <li>South West Sydney</li>
              <li>Sydney CBD</li>
            </ul>
            <p className="text-white/60 text-xs mt-3">
              Premium: Vaucluse, Watsons Bay, Mosman, Double Bay
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-[#D4AF37] font-semibold mb-4 font-playfair">Contact Us</h3>
            <ul className="space-y-2 text-white/70 text-sm">
              <li>Email: info@eliorasignaturecatering.com.au</li>
              <li>
                Phone:{' '}
                <a href="tel:0410759741" className="text-[#D4AF37] hover:text-[#D4AF37]/80">
                  0410 759 741
                </a>
              </li>
              <li>Hours: Monday – Sunday: 9:00 AM – 6:00 PM</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#D4AF37]/30 pt-8 mt-8">
          <p className="text-center text-white/70 text-sm">
            © {new Date().getFullYear()} Eliora Signature Catering. All rights reserved.
            Created by <a href="https://www.cbsinstylewebdesigns.com.au" target="_blank" className="text-[#D4AF37] hover:text-[#D4AF37]/80 transition-colors">CBS Instyle Web Designs</a>
          </p>
        </div>
      </div>
    </footer>
  )
}


