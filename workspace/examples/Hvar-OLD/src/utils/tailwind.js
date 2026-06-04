/**
 * HVAR Tailwind Utilities
 * Utility functions for working with Tailwind classes
 */

/**
 * Combines class names conditionally
 * @param {...string} classes - Class names to combine
 * @returns {string} - Combined class string
 */
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Returns variant classes for buttons based on variant and size
 * @param {string} variant - Button variant (primary, secondary, outline, ghost)
 * @param {string} size - Button size (xs, sm, md, lg, xl)
 * @returns {string} - Tailwind classes for the button variant
 */
export const getButtonClasses = (variant = 'primary', size = 'md') => {
  // Base classes for all buttons
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  // Variant specific classes
  const variantClasses = {
    primary: 'bg-brand-red-600 text-white hover:bg-brand-red-700 focus:ring-brand-red-500 border border-brand-red-600 dark:bg-brand-red-500 dark:hover:bg-brand-red-600 dark:border-brand-red-500',
    secondary: 'bg-brand-blue-500 text-white hover:bg-brand-blue-600 focus:ring-brand-blue-400 border border-brand-blue-500 dark:bg-brand-blue-400 dark:hover:bg-brand-blue-500 dark:border-brand-blue-400',
    outline: 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-300 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-800',
    ghost: 'bg-transparent border-none text-gray-700 hover:bg-gray-100 focus:ring-gray-300 dark:text-gray-200 dark:hover:bg-gray-800',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-400 border border-red-500',
    success: 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-400 border border-green-500',
  };
  
  // Size specific classes
  const sizeClasses = {
    xs: 'text-xs px-2 py-1',
    sm: 'text-sm px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-5 py-2.5',
    xl: 'text-base px-6 py-3',
  };
  
  return cn(
    baseClasses,
    variantClasses[variant] || variantClasses.primary,
    sizeClasses[size] || sizeClasses.md
  );
};

/**
 * Returns variant classes for badges based on variant and size
 * @param {string} variant - Badge variant
 * @param {string} size - Badge size
 * @returns {string} - Tailwind classes for the badge variant
 */
export const getBadgeClasses = (variant = 'default', size = 'md') => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';
  
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    primary: 'bg-brand-red-100 text-brand-red-800 dark:bg-brand-red-900 dark:text-brand-red-300',
    secondary: 'bg-brand-blue-100 text-brand-blue-800 dark:bg-brand-blue-900 dark:text-brand-blue-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };
  
  const sizeClasses = {
    xs: 'text-xs px-2 py-0.5',
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-sm px-4 py-1.5',
  };
  
  return cn(
    baseClasses,
    variantClasses[variant] || variantClasses.default,
    sizeClasses[size] || sizeClasses.md
  );
};

/**
 * Returns variant classes for cards based on variant
 * @param {string} variant - Card variant
 * @returns {string} - Tailwind classes for the card variant
 */
export const getCardClasses = (variant = 'default') => {
  const baseClasses = 'rounded-lg overflow-hidden transition-all duration-300';
  
  const variantClasses = {
    default: 'bg-white border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700',
    elevated: 'bg-white border border-gray-200 shadow-md dark:bg-gray-800 dark:border-gray-700',
    flat: 'bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700',
    transparent: 'bg-transparent',
  };
  
  return cn(
    baseClasses,
    variantClasses[variant] || variantClasses.default
  );
};

/**
 * Returns animation classes
 * @param {string} animation - Animation type
 * @returns {string} - Tailwind animation classes
 */
export const getAnimationClasses = (animation) => {
  const animationClasses = {
    'fade-in': 'animate-fade-in',
    'slide-up': 'animate-slide-up',
    'slide-right': 'animate-slide-right',
    'slide-left': 'animate-slide-left',
    'pulse': 'animate-pulse',
    'float': 'animate-float',
  };
  
  return animationClasses[animation] || '';
}; 