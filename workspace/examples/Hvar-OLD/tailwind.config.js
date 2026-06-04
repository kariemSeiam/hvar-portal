/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  // Customer Management System - HVAR
  // Optimized for Arabic RTL and customer-centric UI/UX
  theme: {
    extend: {
      colors: {
        // Primary Brand Colors
        'brand-red': {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
          950: '#4c0519',
        },
        
        // Secondary Colors
        'brand-blue': {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        
        // Accent Colors
        'accent-green': {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        'accent-amber': {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        'accent-purple': {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764',
        },
        
        // UI Colors
        'ui-success': {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        'ui-warning': {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        'ui-danger': {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        'ui-info': {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        
        // Background Colors
        'bg-light': '#f9fafb',
        'bg-dark': '#111827',
        'bg-card-dark': '#1f2937',
        'bg-card-light': '#ffffff',
      },
      fontFamily: {
        'cairo': ['Cairo', 'sans-serif'],
        'tajawal': ['Tajawal', 'sans-serif'],
        'sans': ['Tajawal', 'Cairo', 'sans-serif'],
        'display': ['Cairo', 'Tajawal', 'sans-serif'],
      },
      fontSize: {
        // Fluid typography using clamp
        'xs': ['clamp(0.7rem, 0.7rem + 0.1vw, 0.8rem)', { lineHeight: '1.4' }],
        'sm': ['clamp(0.8rem, 0.8rem + 0.1vw, 0.9rem)', { lineHeight: '1.4' }],
        'base': ['clamp(1rem, 0.95rem + 0.2vw, 1.1rem)', { lineHeight: '1.5' }],
        'lg': ['clamp(1.1rem, 1.05rem + 0.25vw, 1.2rem)', { lineHeight: '1.5' }],
        'xl': ['clamp(1.2rem, 1.15rem + 0.3vw, 1.35rem)', { lineHeight: '1.4' }],
        '2xl': ['clamp(1.4rem, 1.35rem + 0.4vw, 1.6rem)', { lineHeight: '1.3' }],
        '3xl': ['clamp(1.7rem, 1.6rem + 0.5vw, 2rem)', { lineHeight: '1.3' }],
        '4xl': ['clamp(2rem, 1.85rem + 0.6vw, 2.4rem)', { lineHeight: '1.2' }],
        '5xl': ['clamp(2.5rem, 2.25rem + 0.7vw, 3rem)', { lineHeight: '1.1' }],
        '6xl': ['clamp(3rem, 2.75rem + 0.8vw, 3.75rem)', { lineHeight: '1.1' }],
      },
      spacing: {
        // Fluid spacing using clamp
        '1': 'clamp(0.25rem, 0.2rem + 0.1vw, 0.3rem)',
        '2': 'clamp(0.5rem, 0.4rem + 0.2vw, 0.6rem)',
        '3': 'clamp(0.75rem, 0.6rem + 0.3vw, 0.9rem)',
        '4': 'clamp(1rem, 0.8rem + 0.4vw, 1.2rem)',
        '5': 'clamp(1.25rem, 1rem + 0.5vw, 1.5rem)',
        '6': 'clamp(1.5rem, 1.2rem + 0.6vw, 1.8rem)',
        '7': 'clamp(1.75rem, 1.4rem + 0.7vw, 2.1rem)',
        '8': 'clamp(2rem, 1.6rem + 0.8vw, 2.4rem)',
        '9': 'clamp(2.25rem, 1.8rem + 0.9vw, 2.7rem)',
        '10': 'clamp(2.5rem, 2rem + 1vw, 3rem)',
        '12': 'clamp(3rem, 2.4rem + 1.2vw, 3.6rem)',
        '16': 'clamp(4rem, 3.2rem + 1.6vw, 4.8rem)',
        '20': 'clamp(5rem, 4rem + 2vw, 6rem)',
        '24': 'clamp(6rem, 4.8rem + 2.4vw, 7.2rem)',
        '32': 'clamp(8rem, 6.4rem + 3.2vw, 9.6rem)',
        '40': 'clamp(10rem, 8rem + 4vw, 12rem)',
        '48': 'clamp(12rem, 9.6rem + 4.8vw, 14.4rem)',
        '56': 'clamp(14rem, 11.2rem + 5.6vw, 16.8rem)',
        '64': 'clamp(16rem, 12.8rem + 6.4vw, 19.2rem)',
      },
      borderRadius: {
        'sm': 'clamp(0.125rem, 0.1rem + 0.05vw, 0.15rem)',
        'md': 'clamp(0.375rem, 0.3rem + 0.15vw, 0.45rem)',
        'lg': 'clamp(0.5rem, 0.4rem + 0.2vw, 0.6rem)',
        'xl': 'clamp(0.75rem, 0.6rem + 0.3vw, 0.9rem)',
        '2xl': 'clamp(1rem, 0.8rem + 0.4vw, 1.2rem)',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'inner-light': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'inner-dark': 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.06)',
        'red': '0 4px 14px 0 rgba(244, 63, 94, 0.2)',
        'blue': '0 4px 14px 0 rgba(14, 165, 233, 0.2)',
        'green': '0 4px 14px 0 rgba(34, 197, 94, 0.2)',
        'amber': '0 4px 14px 0 rgba(249, 115, 22, 0.2)',
        'purple': '0 4px 14px 0 rgba(168, 85, 247, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-right': 'slideRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-left': 'slideLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'pulse': 'pulse 2s infinite cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'bounce 1s infinite cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'float': 'float 3s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        pulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '1rem',
          md: '2rem',
          lg: '2rem',
          xl: '2rem',
        },
        screens: {
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
          '2xl': '1536px',
        },
      },
      // RTL Support
      textAlign: {
        start: 'start',
        end: 'end',
      },
      inset: {
        'start': 'var(--start)',
        'end': 'var(--end)',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'bounce-out': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      backdropBlur: {
        xs: '2px',
      },
      aspectRatio: {
        'square': '1 / 1',
        'video': '16 / 9',
        'portrait': '3 / 4',
        'landscape': '4 / 3',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    function({ addBase, addUtilities }) {
      addBase({
        'html[dir="rtl"]': {
          '--start': 'right',
          '--end': 'left',
        },
        'html[dir="ltr"]': {
          '--start': 'left',
          '--end': 'right',
        },
        'html': {
          fontFamily: 'Tajawal, Cairo, sans-serif',
          scrollBehavior: 'smooth',
        },
        'body': {
          fontFamily: 'Tajawal, Cairo, sans-serif',
          lineHeight: '1.5',
          textRendering: 'optimizeLegibility',
          '-webkit-font-smoothing': 'antialiased',
          '-moz-osx-font-smoothing': 'grayscale',
        },
        'h1, h2, h3, h4, h5, h6': {
          fontFamily: 'Cairo, Tajawal, sans-serif',
          fontWeight: '700',
        },
      });
      
      // Custom utilities
      addUtilities({
        '.text-balance': {
          textWrap: 'balance',
        },
        '.text-pretty': {
          textWrap: 'pretty',
        },
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.mask-radial-faded': {
          'mask-image': 'radial-gradient(circle at center, black 55%, transparent 80%)',
        },
        '.mask-linear-faded-x': {
          'mask-image': 'linear-gradient(to right, black 70%, transparent 95%)',
        },
        '.mask-linear-faded-y': {
          'mask-image': 'linear-gradient(to bottom, black 70%, transparent 95%)',
        },
      });
    },
  ],
}