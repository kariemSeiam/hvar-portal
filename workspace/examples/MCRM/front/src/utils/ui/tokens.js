/**
 * Design Tokens Utility
 * 
 * Helper functions to access design tokens in JavaScript/JSX
 * Use these when you need design token values in component logic
 */

/**
 * Get color value from design token
 * @param {string} colorName - Color name (e.g., 'brand-red-600')
 * @returns {string} CSS custom property reference
 */
export const getColor = (colorName) => {
  return `var(--color-${colorName})`;
};

/**
 * Get spacing value from design token
 * @param {string} size - Spacing size (e.g., '4', '6', '8')
 * @returns {string} CSS custom property reference
 */
export const getSpacing = (size) => {
  return `var(--space-${size})`;
};

/**
 * Get font size value from design token
 * @param {string} size - Font size (e.g., 'base', 'lg', 'xl', 'h1', 'h2')
 * @returns {string} CSS custom property reference
 */
export const getFontSize = (size) => {
  return `var(--font-size-${size})`;
};

/**
 * Get border radius value from design token
 * @param {string} size - Border radius size (e.g., 'sm', 'md', 'lg', 'xl')
 * @returns {string} CSS custom property reference
 */
export const getBorderRadius = (size) => {
  return `var(--radius-${size})`;
};

/**
 * Get shadow value from design token
 * @param {string} size - Shadow size (e.g., 'sm', 'md', 'lg', 'xl', 'brand')
 * @returns {string} CSS custom property reference
 */
export const getShadow = (size) => {
  return `var(--shadow-${size})`;
};

/**
 * Get transition duration value from design token
 * @param {string} speed - Transition speed (e.g., 'fast', 'normal', 'slow')
 * @returns {string} CSS custom property reference
 */
export const getTransition = (speed = 'normal') => {
  return `var(--transition-${speed})`;
};

/**
 * Get transition easing value from design token
 * @param {string} type - Easing type (e.g., 'ease', 'bounce', 'emphasized')
 * @returns {string} CSS custom property reference
 */
export const getEasing = (type = 'emphasized') => {
  return `var(--transition-${type})`;
};

/**
 * Design token color map for easy reference
 * Use these in className strings or style objects
 */
export const colors = {
  // Brand Colors
  brandRed: {
    50: 'var(--color-brand-red-50)',
    100: 'var(--color-brand-red-100)',
    200: 'var(--color-brand-red-200)',
    300: 'var(--color-brand-red-300)',
    400: 'var(--color-brand-red-400)',
    500: 'var(--color-brand-red-500)',
    600: 'var(--color-brand-red-600)',
    700: 'var(--color-brand-red-700)',
    800: 'var(--color-brand-red-800)',
    900: 'var(--color-brand-red-900)',
    950: 'var(--color-brand-red-950)',
  },
  brandBlue: {
    50: 'var(--color-brand-blue-50)',
    100: 'var(--color-brand-blue-100)',
    200: 'var(--color-brand-blue-200)',
    300: 'var(--color-brand-blue-300)',
    400: 'var(--color-brand-blue-400)',
    500: 'var(--color-brand-blue-500)',
    600: 'var(--color-brand-blue-600)',
    700: 'var(--color-brand-blue-700)',
    800: 'var(--color-brand-blue-800)',
    900: 'var(--color-brand-blue-900)',
    950: 'var(--color-brand-blue-950)',
  },
  // Semantic Colors
  success: {
    50: 'var(--color-success-50)',
    500: 'var(--color-success-500)',
    600: 'var(--color-success-600)',
    700: 'var(--color-success-700)',
  },
  warning: {
    50: 'var(--color-warning-50)',
    500: 'var(--color-warning-500)',
    600: 'var(--color-warning-600)',
    700: 'var(--color-warning-700)',
  },
  error: {
    50: 'var(--color-error-50)',
    500: 'var(--color-error-500)',
    600: 'var(--color-error-600)',
    700: 'var(--color-error-700)',
  },
  info: {
    50: 'var(--color-info-50)',
    500: 'var(--color-info-500)',
    600: 'var(--color-info-600)',
    700: 'var(--color-info-700)',
  },
  // Neutral Colors
  gray: {
    50: 'var(--color-gray-50)',
    100: 'var(--color-gray-100)',
    200: 'var(--color-gray-200)',
    300: 'var(--color-gray-300)',
    400: 'var(--color-gray-400)',
    500: 'var(--color-gray-500)',
    600: 'var(--color-gray-600)',
    700: 'var(--color-gray-700)',
    800: 'var(--color-gray-800)',
    900: 'var(--color-gray-900)',
    950: 'var(--color-gray-950)',
  },
  // Background Colors
  bg: {
    light: 'var(--color-bg-light)',
    dark: 'var(--color-bg-dark)',
    cardLight: 'var(--color-bg-card-light)',
    cardDark: 'var(--color-bg-card-dark)',
  },
};

/**
 * Tailwind class name helpers
 * Use these to get consistent Tailwind class names
 */
export const tw = {
  // Primary button
  btnPrimary: 'bg-brand-red-600 hover:bg-brand-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 font-cairo',
  
  // Secondary button
  btnSecondary: 'bg-brand-blue-500 hover:bg-brand-blue-600 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 font-cairo',
  
  // Card
  card: 'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6',
  
  // Input
  input: 'w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand-blue-500 focus:ring-1 focus:ring-brand-blue-500 transition-colors font-tajawal',
  
  // Badge
  badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-cairo',
  
  // Link
  link: 'text-brand-blue-600 hover:text-brand-blue-700 underline-offset-2 hover:underline transition-colors font-tajawal',
};

