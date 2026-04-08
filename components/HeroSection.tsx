'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden animate-fadeIn">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/bck-img.png')",
          }}
        />
        <div className="absolute inset-0 bg-[#0F3D3E] opacity-75" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#D4AF37] mb-6 font-playfair animate-slideUp">
            Authentic Lebanese Catering Sydney
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto font-light animate-slideUp">
            Mediterranean catering and Lebanese favourites for events, offices, and daily meals for family — generous
            platters, delivered across Sydney.
          </p>
          
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/menu"
              className="px-8 py-4 bg-[#D4AF37] text-[#0F3D3E] font-semibold rounded-lg text-lg hover:bg-[#c9a030] transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-[#D4AF37]/50 hover:scale-105"
            >
              Browse Menu
            </Link>
            <Link
              href="/request-quote"
              className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-lg text-lg hover:bg-white hover:text-[#0F3D3E] transition-all duration-200 hover:scale-105"
            >
              Request Quote
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 border-2 border-[#D4AF37] rounded-full flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1 h-3 bg-[#D4AF37] rounded-full mt-2"
          />
        </motion.div>
      </motion.div>
    </section>
  )
}

