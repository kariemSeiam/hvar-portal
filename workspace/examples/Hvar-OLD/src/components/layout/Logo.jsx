import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../ui/ThemeProvider';

/**
 * Logo component for HVAR customer management system
 */
const Logo = ({ size = 'md', showText = true, className = '' }) => {
  const { isDark } = useTheme();
  
  // Size classes for the logo
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10',
    xl: 'h-12'
  };
  
  // Size classes for the text
  const textSizeClasses = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl'
  };
  
  return (
    <Link to="/" className={`flex items-center ${className}`}>
      <img
        src="/src/assets/logo.svg"
        alt="HVAR Logo"
        className={`${sizeClasses[size] || sizeClasses.md}`}
        style={{ filter: isDark ? 'brightness(1.5)' : 'none' }}
      />
      {showText && (
        <span 
          className={`font-bold ${textSizeClasses[size] || textSizeClasses.md} text-gray-900 dark:text-white mr-2 rtl:mr-0 rtl:ml-2`}
        >
          هفار
        </span>
      )}
    </Link>
  );
};

export default Logo; 