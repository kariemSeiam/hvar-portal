import React from 'react';
import { cn, getCardClasses } from '../../utils/tailwind';

/**
 * Card component using Tailwind classes directly
 * 
 * @param {Object} props - Card props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} [props.variant='default'] - Card variant (default, elevated, flat, transparent)
 * @param {string} [props.padding='default'] - Card padding size (none, sm, default, lg)
 * @param {boolean} [props.hover=false] - Whether card has hover effect
 * @param {boolean} [props.isClickable=false] - Whether card is clickable
 * @param {string} [props.className] - Additional classes to add
 */
const Card = ({
  children,
  variant = 'default',
  padding = 'default',
  hover = false,
  isClickable = false,
  className = '',
  ...props
}) => {
  // Determine padding classes
  const getPaddingClasses = () => {
    switch (padding) {
      case 'none': return '';
      case 'sm': return 'p-3';
      case 'lg': return 'p-6';
      case 'default':
      default: return 'p-4';
    }
  };

  // Get hover classes
  const getHoverClasses = () => {
    if (hover) {
      return 'hover:shadow-md transform-gpu transition-all duration-200 hover:-translate-y-1';
    }
    return '';
  };
  
  // Get clickable classes
  const getClickableClasses = () => {
    if (isClickable) {
      return 'cursor-pointer active:transform-gpu active:scale-[0.98] transition-transform';
    }
    return '';
  };

  return (
    <div 
      className={cn(
        getCardClasses(variant),
        getPaddingClasses(),
        getHoverClasses(),
        getClickableClasses(),
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Card Header component
 */
const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  );
};

/**
 * Card Title component
 */
const CardTitle = ({ children, className = '', ...props }) => {
  return (
    <h3 className={cn('text-xl font-bold tracking-tight', className)} {...props}>
      {children}
    </h3>
  );
};

/**
 * Card Description component
 */
const CardDescription = ({ children, className = '', ...props }) => {
  return (
    <p className={cn('text-sm text-gray-500 dark:text-gray-400', className)} {...props}>
      {children}
    </p>
  );
};

/**
 * Card Content component
 */
const CardContent = ({ children, className = '', ...props }) => {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  );
};

/**
 * Card Footer component
 */
const CardFooter = ({ children, className = '', ...props }) => {
  return (
    <div className={cn('mt-4 pt-3 border-t border-gray-200 dark:border-gray-700', className)} {...props}>
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card; 