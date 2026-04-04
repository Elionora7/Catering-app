'use client'

export function PageBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#FFF9EB]">
      {/* Background Image - same as gallery items */}
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/bck-img.png')",
          }}
        />
        {/* Light overlay to maintain readability */}
        <div className="absolute inset-0 bg-[#FFF9EB]/40" />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
