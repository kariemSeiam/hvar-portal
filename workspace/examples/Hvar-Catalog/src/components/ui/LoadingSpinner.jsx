import React from 'react';
import { useDesignSystem } from '../../design_system/DesignSystemProvider';

export const LoadingSpinner = ({ 
  size = 'md', 
  text = 'جاري التحميل...',
  className = '',
  variant = 'default'
}) => {
  const { darkMode, dir } = useDesignSystem();

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-16',
    xl: 'w-16 h-16'
  };

  const variantClasses = {
    default: 'border-gray-300 dark:border-gray-600 border-t-primary-600 dark:border-t-primary-400',
    primary: 'border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400',
    secondary: 'border-gray-200 dark:border-gray-700 border-t-gray-600 dark:border-t-gray-400',
    white: 'border-white/30 border-t-white'
  };

  return (
    <div 
      className={`flex flex-col items-center justify-center p-4 ${className}`} 
      dir={dir}
      role="status"
      aria-label={text}
    >
      <div 
        className={`
          ${sizeClasses[size]} animate-spin rounded-full border-2 
          ${variantClasses[variant]}
        `}
      />
      {text && (
        <p className={`
          mt-2 text-sm text-gray-600 dark:text-gray-400 
          ${dir === 'rtl' ? 'text-right' : 'text-left'}
          font-medium
        `}>
          {text}
        </p>
      )}
      <span className="sr-only">{text}</span>
    </div>
  );
};
