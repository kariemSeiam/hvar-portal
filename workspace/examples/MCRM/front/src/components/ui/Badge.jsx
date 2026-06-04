/**
 * Badge Component - HVAR Design System
 * 
 * Displays status badges with brand colors and proper contrast ratios.
 * WCAG 2.1 AA compliant with focus states for keyboard navigation.
 * 
 * @param {string} variant - Badge variant (default, primary, success, warning, danger, info, secondary)
 * @param {string} size - Badge size (sm, md, lg)
 * @param {string} className - Additional CSS classes
 * @param {React.ReactNode} children - Badge content
 */
const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'sm',
  className = '',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red-500';
  
  const variants = {
    default: 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100 border border-gray-300 dark:border-gray-600 shadow-sm',
    primary: 'bg-brand-red-100 text-brand-red-800 dark:bg-brand-red-900/30 dark:text-brand-red-200 border border-brand-red-300 dark:border-brand-red-700/60 shadow-sm',
    secondary: 'bg-brand-blue-100 text-brand-blue-800 dark:bg-brand-blue-900/30 dark:text-brand-blue-200 border border-brand-blue-300 dark:border-brand-blue-700/60 shadow-sm',
    success: 'bg-ui-success-50 text-ui-success-700 dark:bg-ui-success-900/30 dark:text-ui-success-200 border border-ui-success-300 dark:border-ui-success-700/60 shadow-sm',
    warning: 'bg-ui-warning-50 text-ui-warning-700 dark:bg-ui-warning-900/30 dark:text-ui-warning-200 border border-ui-warning-300 dark:border-ui-warning-700/60 shadow-sm',
    danger: 'bg-ui-danger-50 text-ui-danger-700 dark:bg-ui-danger-900/30 dark:text-ui-danger-200 border border-ui-danger-300 dark:border-ui-danger-700/60 shadow-sm',
    info: 'bg-ui-info-50 text-ui-info-700 dark:bg-ui-info-900/30 dark:text-ui-info-200 border border-ui-info-300 dark:border-ui-info-700/60 shadow-sm',
    shipping: 'bg-accent-purple-100 text-accent-purple-800 dark:bg-accent-purple-900/30 dark:text-accent-purple-200 border border-accent-purple-300 dark:border-accent-purple-700/60 shadow-sm',
    maintenance: 'bg-accent-amber-100 text-accent-amber-800 dark:bg-accent-amber-900/30 dark:text-accent-amber-200 border border-accent-amber-300 dark:border-accent-amber-700/60 shadow-sm',
    completed: 'bg-accent-green-100 text-accent-green-800 dark:bg-accent-green-900/30 dark:text-accent-green-200 border border-accent-green-300 dark:border-accent-green-700/60 shadow-sm',
    failed: 'bg-ui-danger-100 text-ui-danger-800 dark:bg-ui-danger-900/30 dark:text-ui-danger-200 border border-ui-danger-300 dark:border-ui-danger-700/60 shadow-sm',
    pending: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 shadow-sm',
    processing: 'bg-brand-blue-100 text-brand-blue-800 dark:bg-brand-blue-900/30 dark:text-brand-blue-200 border border-brand-blue-300 dark:border-brand-blue-700/60 shadow-sm'
  };
  
  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <span 
      className={`${baseClasses} ${variants[variant] || variants.default} ${sizes[size]} ${className}`}
      role="status"
      aria-label={typeof children === 'string' ? children : undefined}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge; 