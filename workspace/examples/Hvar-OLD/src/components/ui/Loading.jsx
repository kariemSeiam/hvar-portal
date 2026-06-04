import React from 'react';

/**
 * Spinner Component - Basic loading spinner
 */
const Spinner = ({ size = 'md', color = 'primary', className = '' }) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const colorClasses = {
    primary: 'text-red-600',
    secondary: 'text-gray-600',
    white: 'text-white',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
  };

  return (
    <svg
      className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

/**
 * Dots Loading Animation
 */
const DotsLoading = ({ size = 'md', color = 'primary', className = '' }) => {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  const colorClasses = {
    primary: 'bg-red-600',
    secondary: 'bg-gray-600',
    white: 'bg-white',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600',
  };

  return (
    <div className={`flex space-x-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-pulse`}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s',
          }}
        />
      ))}
    </div>
  );
};

/**
 * Pulse Loading Animation
 */
const PulseLoading = ({ size = 'md', color = 'primary', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const colorClasses = {
    primary: 'bg-red-600',
    secondary: 'bg-gray-600',
    white: 'bg-white',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600',
  };

  return (
    <div className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-pulse ${className}`} />
  );
};

/**
 * Progress Bar Loading
 */
const ProgressBar = ({ progress = 0, color = 'primary', showPercentage = false, className = '' }) => {
  const colorClasses = {
    primary: 'bg-red-600',
    secondary: 'bg-gray-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600',
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
        <div
          className={`h-2 ${colorClasses[color]} rounded-full transition-all duration-300 ease-in-out`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      {showPercentage && (
        <div className="text-sm text-gray-600 mt-1 text-center">
          {Math.round(progress)}%
        </div>
      )}
    </div>
  );
};

/**
 * Skeleton Loading for content placeholders
 */
const Skeleton = ({ 
  className = '', 
  height = 'h-4', 
  width = 'w-full', 
  rounded = 'rounded',
  animation = true 
}) => {
  return (
    <div
      className={`bg-gray-200 ${height} ${width} ${rounded} ${animation ? 'animate-pulse' : ''} ${className}`}
    />
  );
};

/**
 * Card Skeleton for loading cards
 */
const CardSkeleton = ({ className = '' }) => {
  return (
    <div className={`p-4 border border-gray-200 rounded-lg shadow-sm bg-white ${className}`}>
      <div className="animate-pulse">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-1/3 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        
        {/* Content */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
        
        {/* Footer */}
        <div className="flex justify-between items-center mt-4">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-8 w-20 rounded" />
        </div>
      </div>
    </div>
  );
};

/**
 * Table Skeleton for loading tables
 */
const TableSkeleton = ({ rows = 5, cols = 4, className = '' }) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          {/* Header */}
          <thead className="bg-gray-50">
            <tr>
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-6 py-3">
                  <Skeleton className="h-4" />
                </th>
              ))}
            </tr>
          </thead>
          
          {/* Body */}
          <tbody className="divide-y divide-gray-200 bg-white">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: cols }).map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4">
                    <Skeleton className="h-4" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * Main Loading Component with different variants
 */
const Loading = ({ 
  variant = 'spinner', 
  size = 'md', 
  color = 'primary', 
  text = null,
  overlay = false,
  fullscreen = false,
  className = '',
  ...props 
}) => {
  const LoadingComponent = () => {
    switch (variant) {
      case 'dots':
        return <DotsLoading size={size} color={color} {...props} />;
      case 'pulse':
        return <PulseLoading size={size} color={color} {...props} />;
      case 'progress':
        return <ProgressBar color={color} {...props} />;
      case 'skeleton':
        return <Skeleton {...props} />;
      case 'card-skeleton':
        return <CardSkeleton {...props} />;
      case 'table-skeleton':
        return <TableSkeleton {...props} />;
      case 'spinner':
      default:
        return <Spinner size={size} color={color} {...props} />;
    }
  };

  const content = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <LoadingComponent />
      {text && (
        <div className="mt-3 text-sm text-gray-600 text-center">
          {text}
        </div>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-75 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};

/**
 * LoadingWrapper - Wraps content with loading state
 */
export const LoadingWrapper = ({ 
  loading, 
  children, 
  variant = 'spinner',
  text = 'جاري التحميل...',
  overlay = true,
  fallback = null,
  className = ''
}) => {
  if (loading) {
    if (fallback) {
      return fallback;
    }
    
    return (
      <div className={`relative min-h-32 ${className}`}>
        {overlay && children}
        <Loading 
          variant={variant} 
          text={text} 
          overlay={overlay}
          className={!overlay ? 'min-h-32' : ''}
        />
      </div>
    );
  }

  return children;
};

/**
 * LoadingButton - Button with loading state
 */
export const LoadingButton = ({ 
  loading = false, 
  disabled = false,
  variant = 'primary',
  size = 'md',
  children,
  loadingText = 'جاري التحميل...',
  className = '',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200';
  
  const variantClasses = {
    primary: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500 text-white',
    outline: 'border border-red-600 text-red-600 hover:bg-red-50',
    ghost: 'text-red-600 hover:bg-red-50',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <Spinner 
          size="sm" 
          color={variant === 'outline' || variant === 'ghost' ? 'primary' : 'white'} 
          className="mr-2" 
        />
      )}
      {loading ? loadingText : children}
    </button>
  );
};

/**
 * Page Loading - Full page loading component
 */
export const PageLoading = ({ 
  text = 'جاري تحميل الصفحة...',
  showLogo = true,
  className = ''
}) => {
  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-white ${className}`}>
      {showLogo && (
        <div className="mb-8">
          <div className="w-16 h-16 bg-red-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
            هـ
          </div>
        </div>
      )}
      
      <Loading variant="spinner" size="lg" color="primary" text={text} />
      
      <div className="mt-8 text-xs text-gray-400 text-center">
        نظام إدارة العملاء والطلبات
      </div>
    </div>
  );
};

/**
 * Content Loading - For loading content areas
 */
export const ContentLoading = ({ 
  variant = 'card-skeleton',
  count = 3,
  className = ''
}) => {
  if (variant === 'card-skeleton') {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (variant === 'table-skeleton') {
    return <TableSkeleton rows={count} className={className} />;
  }

  return <Loading variant={variant} className={className} />;
};

// Export all components
export default Loading;
