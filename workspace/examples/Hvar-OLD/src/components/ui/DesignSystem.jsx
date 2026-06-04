/**
 * ==================== HVAR DESIGN SYSTEM ====================
 * 
 * Professional Design System for HVAR Logistics & Delivery
 * 
 * @version 3.5.0
 * @description Enhanced modern design system with optimized UI/UX patterns for Arabic RTL
 * @author HVAR Development Team
 * @updated 2024
 * 
 * Features:
 * - Complete HVAR brand theming with optimized color palette
 * - Dark/Light theme support with smooth transitions
 * - Accessibility-first design with proper contrast
 * - RTL-optimized components for Arabic language
 * - Advanced data visualization components
 * - Logistics-specific components for delivery tracking
 * - Mobile-responsive with touch-friendly controls
 * - Fluid typography and spacing system
 * - Consistent motion design
 * 
 * Usage:
 * import { TextField, ThemeProvider, Button, etc. } from './components/ui';
 * 
 * ================================================================
 */

import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { 
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, 
  Check, X, AlertCircle, Info, CheckCircle, XCircle,
  Star, Upload, Calendar, Search, Filter, MoreVertical,
  Eye, EyeOff, Copy, ExternalLink, Download, Edit,
  Trash2, Plus, Minus, Home, Package, Truck, User,
  Settings, Bell, MapPin, Clock, Phone, Mail,
  CreditCard, Shield, Heart, Share2, Bookmark,
  Sun, Moon, Menu, Grid as GridIcon, List, BarChart3,
  TrendingUp, TrendingDown, DollarSign, Users,
  Activity, Zap, Target, Award, Navigation,
  Layers, Globe, Wifi, Battery, Signal,
  ArrowLeft, ArrowRight, RotateCcw, RefreshCw,
  FileText, UserPlus, MessageSquare, PhoneCall,
  Map, TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon,
  Circle, Square, Hexagon, Diamond
} from 'lucide-react';

// ==================== HVAR DESIGN SYSTEM ====================
// Professional Design System for HVAR Brand
// Modern, Accessible, and Scalable Component Library

// ==================== ENHANCED THEME CONFIGURATION ====================
const HVAR_THEME = {
  // Enhanced Brand Colors - Professional Logistics Palette with Customer-Centric Design
  colors: {
    // Primary Brand Colors - HVAR Red (Enhanced for Customer Management)
    primary: {
      25: '#fefbfb',
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444', // Main brand color - Customer-focused
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a'
    },
    
    // Secondary - Enhanced Blue for Customer Analytics and Insights
    secondary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9', // Secondary brand color - Analytics focus
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
      950: '#082f49'
    },

    // Success Green - Customer Satisfaction and Loyalty
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e', // Customer satisfaction green
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16'
    },

    // Warning - Customer Attention and Engagement
    warning: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316', // Customer attention orange
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
      950: '#431407'
    },

    // Error - Customer Issues and Support
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444', // Customer issues red
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a'
    },

    // Neutral - Customer Data and Information Display
    neutral: {
      0: '#ffffff',
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712'
    },
    
    // Customer-Centric Accent Colors for Enhanced Data Visualization
    accent1: {
      500: '#8b5cf6' // Purple - VIP Customers
    },
    accent2: {
      500: '#10b981' // Emerald - Premium Tier
    },
    accent3: {
      500: '#f59e0b' // Amber - Loyalty Points
    },
    accent4: {
      500: '#3b82f6' // Blue - Analytics
    },
    accent5: {
      500: '#ec4899' // Pink - Customer Engagement
    },
    
    // Customer Status Colors
    customer: {
      vip: '#8b5cf6',
      premium: '#10b981',
      regular: '#3b82f6',
      new: '#f59e0b',
      inactive: '#6b7280',
      churned: '#ef4444'
    },
    
    // Customer Journey Colors
    journey: {
      awareness: '#3b82f6',
      consideration: '#f59e0b',
      purchase: '#10b981',
      retention: '#8b5cf6',
      advocacy: '#ec4899'
    }
  },

  // Enhanced Typography System - Customer-Centric with Arabic RTL Support
  typography: {
    fontFamily: {
      sans: ['IBM Plex Sans Arabic', 'Tajawal', 'Cairo', 'Noto Sans Arabic', 'Helvetica', 'Arial', 'sans-serif'],
      mono: ['IBM Plex Mono', 'JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      display: ['Almarai', 'Cairo', 'sans-serif'], // For headings and prominent text
      customer: ['IBM Plex Sans Arabic', 'Tajawal', 'Cairo', 'sans-serif'] // Customer-specific font
    },
    
    // Customer-Optimized Fluid Typography Scale
    fontSize: {
      xs: ['clamp(0.75rem, 0.7rem + 0.15vw, 0.825rem)', { lineHeight: '1.4' }],
      sm: ['clamp(0.875rem, 0.825rem + 0.2vw, 0.95rem)', { lineHeight: '1.4' }],
      base: ['clamp(1rem, 0.95rem + 0.25vw, 1.125rem)', { lineHeight: '1.5' }],
      lg: ['clamp(1.125rem, 1.05rem + 0.3vw, 1.25rem)', { lineHeight: '1.5' }],
      xl: ['clamp(1.25rem, 1.15rem + 0.35vw, 1.4rem)', { lineHeight: '1.4' }],
      '2xl': ['clamp(1.5rem, 1.35rem + 0.4vw, 1.75rem)', { lineHeight: '1.3' }],
      '3xl': ['clamp(1.75rem, 1.6rem + 0.5vw, 2.15rem)', { lineHeight: '1.3' }],
      '4xl': ['clamp(2rem, 1.85rem + 0.6vw, 2.55rem)', { lineHeight: '1.2' }],
      '5xl': ['clamp(2.5rem, 2.25rem + 0.7vw, 3.15rem)', { lineHeight: '1.1' }],
      '6xl': ['clamp(3rem, 2.75rem + 0.8vw, 3.9rem)', { lineHeight: '1.1' }],
      // Customer-specific sizes
      'customer-name': ['clamp(1.125rem, 1.05rem + 0.3vw, 1.35rem)', { lineHeight: '1.4' }],
      'customer-phone': ['clamp(0.875rem, 0.825rem + 0.2vw, 0.95rem)', { lineHeight: '1.4' }],
      'customer-stats': ['clamp(1.25rem, 1.15rem + 0.35vw, 1.5rem)', { lineHeight: '1.3' }]
    },

    fontWeight: {
      thin: '100',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800'
    }
  },

  // Customer-Centric Fluid Spacing System
  spacing: {
    0: '0',
    0.5: 'clamp(0.125rem, 0.1rem + 0.1vw, 0.175rem)',
    1: 'clamp(0.25rem, 0.225rem + 0.1vw, 0.325rem)',
    1.5: 'clamp(0.375rem, 0.325rem + 0.15vw, 0.475rem)',
    2: 'clamp(0.5rem, 0.45rem + 0.2vw, 0.65rem)',
    2.5: 'clamp(0.625rem, 0.55rem + 0.25vw, 0.8rem)',
    3: 'clamp(0.75rem, 0.65rem + 0.3vw, 0.95rem)',
    3.5: 'clamp(0.875rem, 0.75rem + 0.35vw, 1.1rem)',
    4: 'clamp(1rem, 0.85rem + 0.4vw, 1.25rem)',
    5: 'clamp(1.25rem, 1.1rem + 0.5vw, 1.6rem)',
    6: 'clamp(1.5rem, 1.3rem + 0.6vw, 1.9rem)',
    7: 'clamp(1.75rem, 1.5rem + 0.7vw, 2.2rem)',
    8: 'clamp(2rem, 1.7rem + 0.8vw, 2.5rem)',
    9: 'clamp(2.25rem, 1.9rem + 0.9vw, 2.8rem)',
    10: 'clamp(2.5rem, 2.1rem + 1vw, 3.1rem)',
    11: 'clamp(2.75rem, 2.3rem + 1.1vw, 3.4rem)',
    12: 'clamp(3rem, 2.5rem + 1.2vw, 3.7rem)',
    14: 'clamp(3.5rem, 2.9rem + 1.4vw, 4.3rem)',
    16: 'clamp(4rem, 3.3rem + 1.6vw, 4.9rem)',
    20: 'clamp(5rem, 4.1rem + 2vw, 6.1rem)',
    24: 'clamp(6rem, 4.9rem + 2.4vw, 7.3rem)',
    28: 'clamp(7rem, 5.7rem + 2.8vw, 8.5rem)',
    32: 'clamp(8rem, 6.5rem + 3.2vw, 9.7rem)',
    36: 'clamp(9rem, 7.3rem + 3.6vw, 10.9rem)',
    40: 'clamp(10rem, 8.1rem + 4vw, 12.1rem)',
    44: 'clamp(11rem, 8.9rem + 4.4vw, 13.3rem)',
    48: 'clamp(12rem, 9.7rem + 4.8vw, 14.5rem)',
    52: 'clamp(13rem, 10.5rem + 5.2vw, 15.7rem)',
    56: 'clamp(14rem, 11.3rem + 5.6vw, 16.9rem)',
    60: 'clamp(15rem, 12.1rem + 6vw, 18.1rem)',
    64: 'clamp(16rem, 12.9rem + 6.4vw, 19.3rem)',
    72: 'clamp(18rem, 14.5rem + 7.2vw, 21.7rem)',
    80: 'clamp(20rem, 16.1rem + 8vw, 24.1rem)',
    96: 'clamp(24rem, 19.3rem + 9.6vw, 28.9rem)',
    
    // Customer-Specific Container Spacing
    'container-sm': 'clamp(1.25rem, 3.5vw, 1.75rem)',
    'container-md': 'clamp(1.75rem, 4.5vw, 2.25rem)',
    'container-lg': 'clamp(2.25rem, 5.5vw, 3.25rem)',
    'container-xl': 'clamp(3.25rem, 6.5vw, 4.25rem)',
    'card-spacing': 'clamp(1.25rem, 3.5vw, 1.5rem)',
    'section-spacing': 'clamp(1.75rem, 4.5vw, 2.75rem)',
    'customer-card-padding': 'clamp(1.5rem, 4vw, 2rem)',
    'customer-detail-spacing': 'clamp(2rem, 5vw, 3rem)',
    'customer-list-gap': 'clamp(1rem, 2.5vw, 1.5rem)',
    
    // Customer-Centric Component Spacing
    'button-padding-x': 'clamp(0.75rem, 0.65rem + 0.3vw, 0.95rem)',
    'button-padding-y': 'clamp(0.5rem, 0.45rem + 0.2vw, 0.65rem)',
    'input-padding-x': 'clamp(0.75rem, 0.65rem + 0.3vw, 0.95rem)',
    'input-padding-y': 'clamp(0.5rem, 0.45rem + 0.2vw, 0.65rem)',
    'card-padding': 'clamp(1.25rem, 1.1rem + 0.5vw, 1.6rem)',
    'nav-item-padding-x': 'clamp(0.75rem, 0.65rem + 0.3vw, 0.95rem)',
    'nav-item-padding-y': 'clamp(0.625rem, 0.55rem + 0.25vw, 0.8rem)',
    'customer-action-padding': 'clamp(0.875rem, 0.75rem + 0.35vw, 1.1rem)',
    'customer-search-padding': 'clamp(1rem, 0.85rem + 0.4vw, 1.25rem)',
    'customer-filter-spacing': 'clamp(0.75rem, 0.65rem + 0.3vw, 0.95rem)',
  },

  // Customer-Centric Border Radius System
  borderRadius: {
    none: '0',
    xs: 'clamp(0.0625rem, 0.05rem + 0.025vw, 0.075rem)',
    sm: 'clamp(0.125rem, 0.1rem + 0.05vw, 0.15rem)',
    base: 'clamp(0.25rem, 0.2rem + 0.1vw, 0.3rem)',
    md: 'clamp(0.375rem, 0.3rem + 0.15vw, 0.45rem)',
    lg: 'clamp(0.5rem, 0.4rem + 0.2vw, 0.6rem)',
    xl: 'clamp(0.75rem, 0.6rem + 0.3vw, 0.9rem)',
    '2xl': 'clamp(1rem, 0.8rem + 0.4vw, 1.2rem)',
    '3xl': 'clamp(1.5rem, 1.2rem + 0.6vw, 1.8rem)',
    '4xl': 'clamp(2rem, 1.6rem + 0.8vw, 2.4rem)',
    full: '9999px',
    // Customer-specific radius
    'customer-card': 'clamp(0.75rem, 0.6rem + 0.3vw, 0.9rem)',
    'customer-avatar': 'clamp(0.5rem, 0.4rem + 0.2vw, 0.6rem)',
    'customer-badge': 'clamp(0.25rem, 0.2rem + 0.1vw, 0.3rem)'
  },

  // Customer-Centric Shadow System
  boxShadow: {
    none: 'none',
    xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    'dark-xs': '0 1px 2px rgba(255, 255, 255, 0.05)',
    'dark-sm': '0 1px 3px rgba(255, 255, 255, 0.1), 0 1px 2px rgba(255, 255, 255, 0.06)',
    'dark-md': '0 4px 6px -1px rgba(255, 255, 255, 0.05), 0 2px 4px -1px rgba(255, 255, 255, 0.03)',
    'dark-lg': '0 10px 15px -3px rgba(255, 255, 255, 0.05), 0 4px 6px -2px rgba(255, 255, 255, 0.025)',
    'dark-xl': '0 20px 25px -5px rgba(255, 255, 255, 0.05), 0 10px 10px -5px rgba(255, 255, 255, 0.02)',
    'dark-2xl': '0 25px 50px -12px rgba(255, 255, 255, 0.1)',
    'dark-inner': 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.03)',
    // Customer-specific shadows
    'customer-card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    'customer-card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    'customer-avatar': '0 2px 4px rgba(0, 0, 0, 0.1)',
    'customer-badge': '0 1px 2px rgba(0, 0, 0, 0.05)',
    'customer-search': '0 4px 6px -1px rgba(239, 68, 68, 0.1), 0 2px 4px -1px rgba(239, 68, 68, 0.06)',
    'customer-search-focus': '0 0 0 3px rgba(239, 68, 68, 0.1), 0 4px 6px -1px rgba(239, 68, 68, 0.1)'
  },

  // Transitions and animations
  transition: {
    duration: {
      fastest: '50ms',
      faster: '100ms',
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
      slower: '400ms',
      slowest: '500ms'
    },
    timing: {
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    }
  },
  
  // Z-index scale
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800
  },

  // Media queries for responsive design
  breakpoints: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },
  
  // Motion design system
  motion: {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.2, ease: 'easeOut' }
    },
    slideUp: {
      initial: { y: 20, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    slideRight: {
      initial: { x: -20, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    slideLeft: {
      initial: { x: 20, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    scale: {
      initial: { scale: 0.9, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      transition: { duration: 0.3, ease: 'easeOut' }
    }
  },

  // New screen breakpoints for even more responsive designs
  screens: {
    'xs': '390px',   // Small mobile
    'sm': '640px',   // Mobile
    'md': '768px',   // Tablet 
    'lg': '1024px',  // Small laptop
    'xl': '1280px',  // Laptop/Desktop
    '2xl': '1536px', // Large desktop
  },

  // Enhanced Container Sizes
  containerSizes: {
    'xs': 'max-w-sm',
    'sm': 'max-w-md',
    'md': 'max-w-lg',
    'lg': 'max-w-xl',
    'xl': 'max-w-2xl',
    '2xl': 'max-w-3xl',
    '3xl': 'max-w-4xl',
    '4xl': 'max-w-5xl',
    '5xl': 'max-w-6xl',
    '6xl': 'max-w-7xl',
    'full': 'max-w-full',
    'screen': 'max-w-screen',
  },
};

// ==================== THEME CONTEXT ====================
const ThemeContext = createContext({
  isDark: false,
  toggleDarkMode: () => {},
  direction: 'rtl',
  toggleDirection: () => {},
  theme: HVAR_THEME,
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Instead of throwing an error, provide a default theme
    console.warn('useTheme was called outside of a ThemeProvider. Using default theme.');
    return {
      isDark: false,
      toggleDarkMode: () => {},
      direction: 'rtl',
      toggleDirection: () => {},
      theme: HVAR_THEME
    };
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Get system preference for dark mode
  const getSystemPreference = () => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  };

  // Initialize state from localStorage or system preference
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hvar-theme-mode');
      return saved ? saved === 'dark' : getSystemPreference();
    }
    return false;
  });

  // Initialize direction from localStorage or default to RTL for Arabic
  const [direction, setDirection] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hvar-theme-direction');
      return saved || 'rtl'; // Default to RTL for Arabic
    }
    return 'rtl';
  });

  // Listen for system preference changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => {
        const userPreference = localStorage.getItem('hvar-theme-mode');
        if (!userPreference) {
          setIsDark(e.matches);
        }
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Apply theme changes to document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      // Apply dark mode
      document.documentElement.classList.toggle('dark', isDark);
      localStorage.setItem('hvar-theme-mode', isDark ? 'dark' : 'light');
      
      // Apply direction
      document.documentElement.dir = direction;
      document.documentElement.lang = direction === 'rtl' ? 'ar' : 'en';
      localStorage.setItem('hvar-theme-direction', direction);
    }
  }, [isDark, direction]);

  const toggleDarkMode = () => setIsDark(!isDark);
  const toggleDirection = () => setDirection(direction === 'ltr' ? 'rtl' : 'ltr');

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    isDark,
    toggleDarkMode,
    direction,
    toggleDirection,
    theme: HVAR_THEME,
  }), [isDark, direction]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <div className={`${isDark ? 'dark' : 'light'}`} dir={direction}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

// Utility function for conditional class names
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

// ==================== UTILITY FUNCTIONS ====================
export const getColorClasses = (color, variant = 'default', isDark = false) => {
  const colorMap = {
    primary: isDark ? "text-blue-400 bg-blue-950/50 border-blue-800" : "text-blue-600 bg-blue-50 border-blue-200",
    secondary: isDark ? "text-orange-400 bg-orange-950/50 border-orange-800" : "text-orange-600 bg-orange-50 border-orange-200",
    success: isDark ? "text-green-400 bg-green-950/50 border-green-800" : "text-green-600 bg-green-50 border-green-200",
    warning: isDark ? "text-yellow-400 bg-yellow-950/50 border-yellow-800" : "text-yellow-600 bg-yellow-50 border-yellow-200",
    error: isDark ? "text-red-400 bg-red-950/50 border-red-800" : "text-red-600 bg-red-50 border-red-200",
    neutral: isDark ? "text-slate-300 bg-slate-800 border-slate-700" : "text-slate-600 bg-slate-50 border-slate-200"
  };

  return colorMap[color] || colorMap.neutral;
};

// ==================== CORE COMPONENTS ====================

// Typography Component
export const Typography = ({
  variant = "body",
  children,
  color = "default",
  weight = "normal",
  align = "right",
  className = "",
  as: Component = "p",
  ...props
}) => {
  const { isDark } = useTheme();

  const variants = {
    h1: "text-4xl md:text-5xl lg:text-6xl font-bold leading-tight",
    h2: "text-3xl md:text-4xl lg:text-5xl font-bold leading-tight",
    h3: "text-2xl md:text-3xl lg:text-4xl font-semibold leading-tight",
    h4: "text-xl md:text-2xl lg:text-3xl font-semibold leading-tight",
    h5: "text-lg md:text-xl lg:text-2xl font-medium leading-tight",
    h6: "text-base md:text-lg lg:text-xl font-medium leading-tight",
    body: "text-base leading-relaxed",
    bodyLarge: "text-lg leading-relaxed",
    bodySmall: "text-sm leading-relaxed",
    caption: "text-xs leading-normal",
    overline: "text-xs font-medium uppercase tracking-wider leading-normal"
  };

  const colors = {
    default: isDark ? "text-slate-100" : "text-slate-900",
    muted: isDark ? "text-slate-400" : "text-slate-600",
    primary: isDark ? "text-blue-400" : "text-blue-600",
    secondary: isDark ? "text-orange-400" : "text-orange-600",
    success: isDark ? "text-green-400" : "text-green-600",
    warning: isDark ? "text-yellow-400" : "text-yellow-600",
    error: isDark ? "text-red-400" : "text-red-600",
    white: "text-white",
    inherit: "text-inherit"
  };

  const weights = {
    thin: "font-thin",
    light: "font-light",
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
    extrabold: "font-extrabold"
  };

  const alignments = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
    justify: "text-justify"
  };

  return (
    <Component
      className={cn(
        variants[variant],
        colors[color],
        weights[weight],
        alignments[align],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};

// Container Component
export const Container = ({
  children,
  size = "default",
  padding = "default",
  className = "",
  ...props
}) => {
  // Enhanced container sizes with better responsive behavior
  const getContainerSize = () => {
    switch (size) {
      case "sm": return "max-w-screen-sm";
      case "md": return "max-w-screen-md";
      case "lg": return "max-w-screen-lg";
      case "xl": return "max-w-screen-xl";
      case "2xl": return "max-w-screen-2xl";
      case "full": return "max-w-full";
      case "default": return "max-w-screen-xl";
      default: return "max-w-screen-xl";
    }
  };
  
  // Enhanced padding with more responsive options
  const getPadding = () => {
    switch (padding) {
      case "none": return "px-0";
      case "sm": return "px-4 sm:px-6 md:px-8";
      case "md": return "px-5 sm:px-8 md:px-10";
      case "lg": return "px-6 sm:px-10 md:px-12";
      case "xl": return "px-8 sm:px-12 md:px-16";
      case "default": return "px-4 sm:px-6 md:px-8";
      default: return "px-4 sm:px-6 md:px-8";
    }
  };
  
  return (
    <div 
      className={cn(
        getContainerSize(),
        getPadding(),
        "mx-auto w-full",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Card Component
export const Card = ({
  children,
  variant = "default",
  padding = "default",
  hover = false,
  bordered = true,
  className = "",
  ...props
}) => {
  // Enhanced card variants with better styling
  const getCardStyles = () => {
    const baseStyles = "rounded-lg overflow-hidden";
    
    switch (variant) {
      case "elevated":
        return cn(
          baseStyles,
          "bg-white dark:bg-gray-800 shadow-md",
          bordered && "border border-gray-200 dark:border-gray-700"
        );
      case "filled":
        return cn(
          baseStyles,
          "bg-gray-50 dark:bg-gray-800/50",
          bordered && "border border-gray-200 dark:border-gray-700"
        );
      case "outline":
        return cn(
          baseStyles,
          "bg-transparent",
          bordered && "border border-gray-200 dark:border-gray-700"
        );
      case "default":
      default:
        return cn(
          baseStyles,
          "bg-white dark:bg-gray-800",
          bordered && "border border-gray-200 dark:border-gray-700"
        );
    }
  };
  
  // Enhanced padding options
  const getPadding = () => {
    switch (padding) {
      case "none": return "p-0";
      case "sm": return "p-3 sm:p-4";
      case "md": return "p-4 sm:p-5";
      case "lg": return "p-5 sm:p-6";
      case "xl": return "p-6 sm:p-8";
      case "default": return "p-4 sm:p-5";
      default: return "p-4 sm:p-5";
    }
  };
  
  return (
    <div 
      className={cn(
        getCardStyles(),
        getPadding(),
        hover && "transition-shadow duration-200 hover:shadow-md",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Button Component
export const Button = ({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  className = "",
  ...props
}) => {
  // Enhanced button variants with better styling
  const getVariantClasses = () => {
    switch (variant) {
      case "primary":
        return "bg-red-600 hover:bg-red-700 text-white border-transparent focus:ring-red-500";
      case "secondary":
        return "bg-blue-600 hover:bg-blue-700 text-white border-transparent focus:ring-blue-500";
      case "success":
        return "bg-green-600 hover:bg-green-700 text-white border-transparent focus:ring-green-500";
      case "danger":
        return "bg-red-600 hover:bg-red-700 text-white border-transparent focus:ring-red-500";
      case "warning":
        return "bg-amber-500 hover:bg-amber-600 text-white border-transparent focus:ring-amber-500";
      case "info":
        return "bg-blue-500 hover:bg-blue-600 text-white border-transparent focus:ring-blue-500";
      case "outline":
        return "bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 focus:ring-gray-500";
      case "ghost":
        return "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border-transparent focus:ring-gray-500";
      case "link":
        return "bg-transparent hover:underline text-red-600 dark:text-red-400 border-transparent p-0 focus:ring-0";
      default:
        return "bg-red-600 hover:bg-red-700 text-white border-transparent focus:ring-red-500";
    }
  };
  
  // Enhanced button sizes with better padding and font sizes
  const getSizeClasses = () => {
    switch (size) {
      case "xs":
        return "text-xs px-2 py-1 rounded";
      case "sm":
        return "text-sm px-3 py-1.5 rounded-md";
      case "lg":
        return "text-base px-5 py-2.5 rounded-lg";
      case "xl":
        return "text-lg px-6 py-3 rounded-lg";
      case "icon":
        return "p-2 rounded-md";
      case "md":
      default:
        return "text-sm px-4 py-2 rounded-md";
    }
  };
  
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 disabled:opacity-60 disabled:pointer-events-none border",
        getVariantClasses(),
        getSizeClasses(),
        fullWidth && "w-full",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {leftIcon && !loading && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};

// Input Component
export const Input = ({
  type = "text",
  label,
  placeholder,
  value,
  onChange,
  error,
  helperText,
  leftIcon,
  rightIcon,
  disabled = false,
  required = false,
  className = "",
  ...props
}) => {
  const { isDark } = useTheme();

  return (
    <div className="space-y-1">
      {label && (
        <label className={cn(
          "block text-sm font-medium",
          isDark ? "text-slate-200" : "text-slate-700",
          error && (isDark ? "text-red-400" : "text-red-600")
        )}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
            {leftIcon}
          </div>
        )}
        
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full px-4 py-3 rounded-lg border transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-offset-2",
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            
            // Default styles
            isDark 
              ? "bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-400" 
              : "bg-white border-slate-300 text-slate-900 placeholder-slate-500",
            
            // Focus styles
            !error && (isDark 
              ? "focus:border-blue-500 focus:ring-blue-500/20" 
              : "focus:border-blue-500 focus:ring-blue-500/20"),
            
            // Error styles
            error && (isDark 
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
              : "border-red-500 focus:border-red-500 focus:ring-red-500/20"),
            
            // Disabled styles
            disabled && "opacity-50 cursor-not-allowed",
            
            className
          )}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
            {rightIcon}
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <p className={cn(
          "text-sm",
          error 
            ? (isDark ? "text-red-400" : "text-red-600")
            : (isDark ? "text-slate-400" : "text-slate-600")
        )}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};

// Badge Component
export const Badge = ({
  children,
  variant = "default",
  size = "md",
  color = "primary",
  className = "",
  ...props
}) => {
  const { isDark } = useTheme();

  const variants = {
    default: "inline-flex items-center font-medium",
    outline: "inline-flex items-center font-medium border-2",
    dot: "inline-flex items-center font-medium"
  };

  const sizes = {
    xs: "px-2 py-0.5 text-xs",
    sm: "px-2.5 py-1 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base"
  };

  const colors = {
    primary: variant === 'outline' 
      ? (isDark ? "text-blue-400 border-blue-400 bg-transparent" : "text-blue-600 border-blue-600 bg-transparent")
      : (isDark ? "text-blue-100 bg-blue-900/50" : "text-blue-700 bg-blue-100"),
    secondary: variant === 'outline'
      ? (isDark ? "text-orange-400 border-orange-400 bg-transparent" : "text-orange-600 border-orange-600 bg-transparent")
      : (isDark ? "text-orange-100 bg-orange-900/50" : "text-orange-700 bg-orange-100"),
    success: variant === 'outline'
      ? (isDark ? "text-green-400 border-green-400 bg-transparent" : "text-green-600 border-green-600 bg-transparent")
      : (isDark ? "text-green-100 bg-green-900/50" : "text-green-700 bg-green-100"),
    warning: variant === 'outline'
      ? (isDark ? "text-yellow-400 border-yellow-400 bg-transparent" : "text-yellow-600 border-yellow-600 bg-transparent")
      : (isDark ? "text-yellow-100 bg-yellow-900/50" : "text-yellow-700 bg-yellow-100"),
    error: variant === 'outline'
      ? (isDark ? "text-red-400 border-red-400 bg-transparent" : "text-red-600 border-red-600 bg-transparent")
      : (isDark ? "text-red-100 bg-red-900/50" : "text-red-700 bg-red-100"),
    neutral: variant === 'outline'
      ? (isDark ? "text-slate-400 border-slate-400 bg-transparent" : "text-slate-600 border-slate-600 bg-transparent")
      : (isDark ? "text-slate-100 bg-slate-700" : "text-slate-700 bg-slate-100")
  };

  return (
    <span
      className={cn(
        "rounded-full",
        variants[variant],
        sizes[size],
        colors[color],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

// Alert Component
export const Alert = ({
  children,
  title,
  variant = "info",
  icon,
  closeable = false,
  onClose,
  className = "",
  ...props
}) => {
  const { isDark } = useTheme();

  const variants = {
    info: cn(
      isDark ? "bg-blue-950/50 border-blue-800/50 text-blue-100" : "bg-blue-50 border-blue-200 text-blue-800"
    ),
    success: cn(
      isDark ? "bg-green-950/50 border-green-800/50 text-green-100" : "bg-green-50 border-green-200 text-green-800"
    ),
    warning: cn(
      isDark ? "bg-yellow-950/50 border-yellow-800/50 text-yellow-100" : "bg-yellow-50 border-yellow-200 text-yellow-800"
    ),
    error: cn(
      isDark ? "bg-red-950/50 border-red-800/50 text-red-100" : "bg-red-50 border-red-200 text-red-800"
    )
  };

  const defaultIcons = {
    info: <Info className="w-5 h-5" />,
    success: <CheckCircle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />
  };

  return (
    <div
      className={cn(
        "p-4 rounded-lg border",
        variants[variant],
        className
      )}
      {...props}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {icon || defaultIcons[variant]}
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium mb-1">
              {title}
            </h3>
          )}
          <div className="text-sm">
            {children}
          </div>
        </div>
        {closeable && (
          <button
            onClick={onClose}
            className="flex-shrink-0 ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// Avatar Component
export const Avatar = ({
  src,
  alt,
  size = "md",
  fallback,
  status,
  className = "",
  ...props
}) => {
  const { isDark } = useTheme();
  const [imageError, setImageError] = useState(false);

  const sizes = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
    xl: "w-16 h-16 text-xl",
    '2xl': "w-20 h-20 text-2xl"
  };

  const statusColors = {
    online: "bg-green-500",
    offline: "bg-gray-400",
    away: "bg-yellow-500",
    busy: "bg-red-500"
  };

  return (
    <div className={cn("relative inline-block", sizes[size])}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full overflow-hidden",
          "bg-gradient-to-br from-blue-500 to-purple-600",
          sizes[size],
          className
        )}
        {...props}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={alt}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="font-medium text-white">
            {fallback || (alt ? alt.charAt(0).toUpperCase() : '?')}
          </span>
        )}
      </div>
      
      {status && (
        <div
          className={cn(
            "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800",
            statusColors[status]
          )}
        />
      )}
    </div>
  );
};

// Skeleton Component
export const Skeleton = ({
  className = "",
  ...props
}) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-slate-200 dark:bg-slate-700",
        className
      )}
      {...props}
    />
  );
};

// Spinner Component
export const Spinner = ({
  size = "md",
  color = "primary",
  className = "",
  ...props
}) => {
  const sizes = {
    xs: "w-3 h-3",
    sm: "w-4 h-4", 
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12"
  };

  const colors = {
    primary: "border-blue-600",
    secondary: "border-orange-600",
    white: "border-white",
    current: "border-current"
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-transparent border-t-current",
        sizes[size],
        colors[color],
        className
      )}
      {...props}
    />
  );
};

// Divider Component
export const Divider = ({
  orientation = "horizontal",
  label,
  className = "",
  ...props
}) => {
  const { isDark } = useTheme();

  if (orientation === "vertical") {
    return (
      <div
        className={cn(
          "w-px h-full",
          isDark ? "bg-slate-600" : "bg-slate-200",
          className
        )}
        {...props}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center",
        className
      )}
      {...props}
    >
      <div className={cn(
        "flex-1 h-px",
        isDark ? "bg-slate-600" : "bg-slate-200"
      )} />
      {label && (
        <>
          <span className={cn(
            "px-3 text-sm",
            isDark ? "text-slate-400" : "text-slate-600"
          )}>
            {label}
          </span>
          <div className={cn(
            "flex-1 h-px",
            isDark ? "bg-slate-600" : "bg-slate-200"
          )} />
        </>
      )}
    </div>
  );
};





