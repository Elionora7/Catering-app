'use client'

interface CategoryCardProps {
  name: string
  itemCount: number
  onClick: () => void
}

export function CategoryCard({ name, itemCount, onClick }: CategoryCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 text-left w-full group border-2 border-transparent hover:border-[#D4AF37]"
    >
      <h3 className="text-xl font-semibold text-[#0F3D3E] mb-2 group-hover:text-[#D4AF37] transition-colors">
        {name}
      </h3>
      <p className="text-sm text-gray-600">
        {itemCount} {itemCount === 1 ? 'item' : 'items'}
      </p>
      <div className="mt-4 flex items-center text-[#D4AF37] font-medium text-sm group-hover:translate-x-1 transition-transform">
        View Items
        <svg
          className="w-4 h-4 ml-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </button>
  )
}
