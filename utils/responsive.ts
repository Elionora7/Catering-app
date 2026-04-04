/**
 * Responsive utility functions and breakpoints
 * 
 * Tailwind breakpoints:
 * - sm: 640px
 * - md: 768px
 * - lg: 1024px
 * - xl: 1280px
 * - 2xl: 1536px
 */

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

/**
 * Check if current viewport matches a breakpoint
 */
export function useBreakpoint(breakpoint: keyof typeof breakpoints): boolean {
  if (typeof window === 'undefined') return false
  
  return window.innerWidth >= breakpoints[breakpoint]
}

/**
 * Get responsive grid columns class
 */
export function getGridCols(items: number): string {
  if (items === 1) return 'grid-cols-1'
  if (items === 2) return 'grid-cols-1 sm:grid-cols-2'
  if (items === 3) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
  if (items === 4) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
}

/**
 * Responsive padding utilities
 */
export const responsivePadding = {
  container: 'p-4 sm:p-6 lg:p-8',
  section: 'px-4 sm:px-6 lg:px-8 py-6 sm:py-8',
  card: 'p-4 sm:p-6',
}

/**
 * Responsive text sizes
 */
export const responsiveText = {
  h1: 'text-3xl sm:text-4xl lg:text-5xl',
  h2: 'text-2xl sm:text-3xl lg:text-4xl',
  h3: 'text-xl sm:text-2xl lg:text-3xl',
  body: 'text-sm sm:text-base',
  small: 'text-xs sm:text-sm',
}











