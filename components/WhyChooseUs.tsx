'use client'

import { FadeUp } from './animations/FadeUp'

const features = [
  {
    icon: '🌿',
    title: 'Fresh Ingredients',
    description: 'We source only the finest, freshest ingredients for authentic flavors',
  },
  {
    icon: '🇱🇧',
    title: 'Authentic Lebanese Taste',
    description: 'Traditional recipes passed down through generations, prepared with love',
  },
  {
    icon: '👔',
    title: 'Professional Service',
    description: 'Experienced team ensuring your event runs smoothly from start to finish',
  },
  {
    icon: '📦',
    title: 'Flexible Catering Packages',
    description: 'Customizable options to suit your needs, budget, and preferences',
  },
]

export function WhyChooseUs() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <FadeUp>
          <h2 className="text-4xl md:text-5xl font-bold text-[#0F3D3E] text-center mb-4 font-playfair">
            Why Choose Us
          </h2>
          <p className="text-center text-[#0F3D3E]/70 mb-12 text-lg max-w-2xl mx-auto">
            Experience the difference of premium catering with authentic flavors
          </p>
        </FadeUp>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <FadeUp key={feature.title} delay={index * 0.1}>
              <div className="text-center p-6 rounded-lg hover:bg-[#FFF9EB] transition-all duration-300 group">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-[#0F3D3E] mb-3 font-playfair group-hover:text-[#D4AF37] transition-colors">
                  {feature.title}
                </h3>
                <p className="text-[#0F3D3E]/70">
                  {feature.description}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  )
}


