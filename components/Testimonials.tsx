'use client'

import { useState, useEffect } from 'react'
import { FadeUp } from './animations/FadeUp'

const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Wedding Client',
    text: 'Eliora Signature Catering made our wedding absolutely perfect! The food was incredible and the service was impeccable. Our guests are still talking about it!',
    rating: 5,
  },
  {
    id: 2,
    name: 'Michael Chen',
    role: 'Corporate Event',
    text: 'Professional, delicious, and beautifully presented. The team went above and beyond to accommodate our dietary requirements. Highly recommended!',
    rating: 5,
  },
  {
    id: 3,
    name: 'Emma Williams',
    role: 'Birthday Party',
    text: 'The authentic Lebanese flavors brought back memories of my grandmother\'s cooking. Every dish was a masterpiece. Thank you for making our celebration special!',
    rating: 5,
  },
  {
    id: 4,
    name: 'David Brown',
    role: 'Family Gathering',
    text: 'Outstanding quality and service. The team was friendly, efficient, and the food was absolutely delicious. We will definitely be using their services again!',
    rating: 5,
  },
]

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-4xl mx-auto">
        <FadeUp>
          <h2 className="text-4xl md:text-5xl font-bold text-[#0F3D3E] text-center mb-4 font-playfair">
            What Our Clients Say
          </h2>
          <p className="text-center text-[#0F3D3E]/70 mb-12 text-lg">
            Don't just take our word for it
          </p>
        </FadeUp>

        <FadeUp delay={0.2}>
          <div className="relative bg-[#FFF9EB] rounded-lg p-8 md:p-12 shadow-lg">
            {/* Quote Marks */}
            <div className="text-6xl text-[#D4AF37] opacity-30 mb-4 font-playfair">"</div>
            
            {/* Testimonial Content */}
            <div className="min-h-[200px]">
              <p className="text-lg md:text-xl text-[#0F3D3E] mb-6 italic">
                {testimonials[currentIndex].text}
              </p>
              
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                  <span key={i} className="text-[#D4AF37] text-xl">★</span>
                ))}
              </div>
              
              <div>
                <p className="font-semibold text-[#0F3D3E] text-lg">
                  {testimonials[currentIndex].name}
                </p>
                <p className="text-[#0F3D3E]/70">
                  {testimonials[currentIndex].role}
                </p>
              </div>
            </div>

            {/* Navigation Dots */}
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    index === currentIndex
                      ? 'bg-[#D4AF37] w-8'
                      : 'bg-[#D4AF37]/30 hover:bg-[#D4AF37]/50'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  )
}


