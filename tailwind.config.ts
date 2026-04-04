import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        
        // Brand Colors - Exact Specifications
        gold: {
          DEFAULT: 'var(--gold-primary)',
          logo: '#D4AF37',
          50: 'var(--gold-50)',
          100: 'var(--gold-100)',
          200: 'var(--gold-200)',
          300: 'var(--gold-300)',
          400: 'var(--gold-400)',
          500: 'var(--gold-500)',
          600: 'var(--gold-600)',
          700: 'var(--gold-700)',
          800: 'var(--gold-800)',
          900: 'var(--gold-900)',
        },
        
        burgundy: {
          DEFAULT: 'var(--burgundy-primary)',
          50: 'var(--burgundy-50)',
          100: 'var(--burgundy-100)',
          200: 'var(--burgundy-200)',
          300: 'var(--burgundy-300)',
          400: 'var(--burgundy-400)',
          500: 'var(--burgundy-500)',
          600: 'var(--burgundy-600)',
          700: 'var(--burgundy-700)',
          800: 'var(--burgundy-800)',
          900: 'var(--burgundy-900)',
        },
        
        cream: {
          DEFAULT: 'var(--cream-background)',
          50: 'var(--cream-50)',
          100: 'var(--cream-100)',
          200: 'var(--cream-200)',
          300: 'var(--cream-300)',
          400: 'var(--cream-400)',
          500: 'var(--cream-500)',
          600: 'var(--cream-600)',
          700: 'var(--cream-700)',
          800: 'var(--cream-800)',
          900: 'var(--cream-900)',
        },
        
        olive: {
          DEFAULT: 'var(--olive-green)',
          50: 'var(--olive-50)',
          100: 'var(--olive-100)',
          200: 'var(--olive-200)',
          300: 'var(--olive-300)',
          400: 'var(--olive-400)',
          500: 'var(--olive-500)',
          600: 'var(--olive-600)',
          700: 'var(--olive-700)',
          800: 'var(--olive-800)',
          900: 'var(--olive-900)',
        },
        
        // Semantic Colors
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          light: 'var(--primary-light)',
          dark: 'var(--primary-dark)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          hover: 'var(--secondary-hover)',
          light: 'var(--secondary-light)',
          dark: 'var(--secondary-dark)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          light: 'var(--accent-light)',
          dark: 'var(--accent-dark)',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Times New Roman', 'serif'],
        sans: ['Arial', 'Helvetica', 'sans-serif'],
        playfair: ['var(--font-playfair)', 'Playfair Display', 'serif'],
        inter: ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'sm': '0 1px 2px 0 var(--shadow-sm)',
        'md': '0 4px 6px -1px var(--shadow-md)',
        'lg': '0 10px 15px -3px var(--shadow-lg)',
        'xl': '0 20px 25px -5px var(--shadow-xl)',
        'gold': '0 4px 12px var(--shadow-gold)',
        'burgundy': '0 4px 12px var(--shadow-burgundy)',
      },
      spacing: {
        'section': 'var(--spacing-section)',
        'section-sm': 'var(--spacing-section-sm)',
      },
    },
  },
  plugins: [],
}
export default config

