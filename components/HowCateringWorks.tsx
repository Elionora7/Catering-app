'use client'

import { FadeUp } from '@/components/animations/FadeUp'

const steps = [
  { title: 'Browse the menu', description: 'Choose from Lebanese favourites and catering platters.' },
  { title: 'Add items to your cart', description: 'Adjust quantities and build the perfect spread.' },
  { title: 'Choose delivery date and location', description: 'We confirm delivery availability via postcode at checkout.' },
  { title: 'Enjoy fresh catering', description: 'Prepared with care and delivered across Sydney.' },
]

export function HowCateringWorks() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <FadeUp>
          <h2 className="text-4xl md:text-5xl font-bold text-[#0F3D3E] text-center mb-4 font-playfair">
            How Catering Works
          </h2>
          <p className="text-center text-[#0F3D3E]/70 mb-12 text-lg max-w-2xl mx-auto">
            Simple ordering designed for catering.
          </p>
        </FadeUp>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <FadeUp key={step.title} delay={index * 0.08}>
              <div className="bg-[#FFF9EB] rounded-lg p-6 border-2 border-transparent hover:border-[#D4AF37] transition-colors">
                <div className="text-[#D4AF37] font-bold text-xl mb-3">
                  {index + 1}.
                </div>
                <h3 className="font-semibold text-[#0F3D3E] mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-[#0F3D3E]/70">
                  {step.description}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  )
}

