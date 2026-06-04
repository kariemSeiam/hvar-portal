import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Semantic CSS Variable Colors
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        danger: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        // Wilson Gold — theme-aware via CSS vars (Egyptian Gold #FEB636 at 500)
        gold: {
          50: 'hsl(var(--gold-50))',
          100: 'hsl(var(--gold-100))',
          200: 'hsl(var(--gold-200))',
          300: 'hsl(var(--gold-300))',
          400: 'hsl(var(--gold-400))',
          500: 'hsl(var(--gold-500))',
          600: 'hsl(var(--gold-600))',
          700: 'hsl(var(--gold-700))',
          800: 'hsl(var(--gold-800))',
          950: 'hsl(var(--gold-950))',
        },
        // Warm Neutrals
        stone: {
          50: '#FAFAF9',
          100: '#F5F5F4',
          200: '#E7E5E4',
          300: '#D6D3D1',
          400: '#A8A29E',
          500: '#78716C',
          600: '#57534E',
          700: '#44403C',
          800: '#292524',
          900: '#1C1917',
          950: '#0C0A09',
        },
        // Brand aliases (Wilson)
        brand: {
          gold: '#E8A317',
          goldHover: '#D4A017',
          silver: '#94A3B8',
          slate: '#F1F5F9',
        },
        // Badge colors
        badge: {
          new: '#7C3AED',
          sale: '#DC2626',
          bestseller: '#F59E0B',
          'low-stock': '#D97706',
        },
      },
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
        tajawal: ['Tajawal', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        display: ['"Playfair Display"', 'Cairo', 'serif'],
        arabic: ['Cairo', 'Tajawal', 'system-ui', 'sans-serif'],
        english: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        hero: 'clamp(2.5rem, 5vw + 1rem, 4.5rem)',
        h1: 'clamp(2rem, 4vw + 0.5rem, 3.5rem)',
        h2: 'clamp(1.5rem, 3vw + 0.5rem, 2.5rem)',
        h3: 'clamp(1.25rem, 2vw + 0.5rem, 2rem)',
        h4: 'clamp(1.125rem, 1.5vw + 0.5rem, 1.5rem)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      /* Wilson: touch target minimum 44px (accessibility + mobile) */
      minHeight: { touch: '44px' },
      minWidth: { touch: '44px' },
      boxShadow: {
        gold: '0 0 25px 5px hsl(var(--primary)/0.25)',
        'gold-sm': '0 0 15px 2px hsl(var(--primary)/0.15)',
        'gold-lg': '0 0 35px 10px hsl(var(--primary)/0.3)',
        'gold-cta': '0 2px 12px hsl(var(--primary)/0.25)',
        'gold-cta-hover': '0 4px 20px hsl(var(--primary)/0.4)',
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-out': 'fadeOut 0.3s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'fade-in-down': 'fadeInDown 0.6s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'slide-in-right': 'slideInRight 0.4s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.4s ease-out forwards',
        'slide-in-from-top': 'slideInFromTop 0.3s ease-out forwards',
        'slide-in-from-bottom': 'slideInFromBottom 0.3s ease-out forwards',
        'slide-in-from-left': 'slideInFromLeft 0.3s ease-out forwards',
        'slide-in-from-right': 'slideInFromRight 0.3s ease-out forwards',
        /* Menu drawer — creative 3D door-swing for RTL/LTR */
        'menu-drawer-open-rtl':
          'menuDrawerOpenRTL 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'menu-drawer-open-ltr':
          'menuDrawerOpenLTR 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'menu-drawer-close-rtl':
          'menuDrawerCloseRTL 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'menu-drawer-close-ltr':
          'menuDrawerCloseLTR 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
        float: 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInFromTop: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideInFromBottom: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideInFromLeft: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideInFromRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        /* Menu drawer — 3D door-swing (RTL: right hinge, LTR: left hinge) */
        menuDrawerOpenRTL: {
          '0%': {
            transform: 'translateX(100%) rotateY(12deg)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateX(0) rotateY(0)',
            opacity: '1',
          },
        },
        menuDrawerOpenLTR: {
          '0%': {
            transform: 'translateX(-100%) rotateY(-12deg)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateX(0) rotateY(0)',
            opacity: '1',
          },
        },
        menuDrawerCloseRTL: {
          '0%': {
            transform: 'translateX(0) rotateY(0)',
            opacity: '1',
          },
          '100%': {
            transform: 'translateX(100%) rotateY(12deg)',
            opacity: '0.8',
          },
        },
        menuDrawerCloseLTR: {
          '0%': {
            transform: 'translateX(0) rotateY(0)',
            opacity: '1',
          },
          '100%': {
            transform: 'translateX(-100%) rotateY(-12deg)',
            opacity: '0.8',
          },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(232, 163, 23, 0.4)' },
          '50%': { boxShadow: '0 0 0 10px rgba(232, 163, 23, 0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) translateX(0)' },
          '25%': { transform: 'translateY(-8px) translateX(3px)' },
          '50%': { transform: 'translateY(-4px) translateX(-2px)' },
          '75%': { transform: 'translateY(-10px) translateX(2px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
