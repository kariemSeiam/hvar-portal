import React from 'react';
import { cn, getButtonClasses } from '../../utils/tailwind';

/**
 * Button component using Tailwind classes directly
 * 
 * @param {Object} props - Button props
 * @param {string} [props.variant='primary'] - Button variant (primary, secondary, outline, ghost, danger, success)
 * @param {string} [props.size='md'] - Button size (xs, sm, md, lg, xl)
 * @param {boolean} [props.fullWidth=false] - Whether button takes full width
 * @param {boolean} [props.disabled=false] - Whether button is disabled
 * @param {boolean} [props.isLoading=false] - Whether button is in loading state
 * @param {React.ReactNode} [props.leftIcon] - Icon to show on the left side of button text
 * @param {React.ReactNode} [props.rightIcon] - Icon to show on the right side of button text
 * @param {string} [props.className] - Additional classes to add
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {
  return (
    <button
      className={cn(
        getButtonClasses(variant, size),
        fullWidth ? 'w-full' : '',
        isLoading ? 'opacity-80 pointer-events-none' : '',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0 rtl:-mr-1 text-current"
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
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          {children}
        </>
      ) : (
        <>
          {leftIcon && (
            <span className={cn('ltr:mr-2 rtl:ml-2', size === 'xs' ? 'text-xs' : '')}>
              {leftIcon}
            </span>
          )}
          {children}
          {rightIcon && (
            <span className={cn('ltr:ml-2 rtl:mr-2', size === 'xs' ? 'text-xs' : '')}>
              {rightIcon}
            </span>
          )}
        </>
      )}
    </button>
  );
};

export default Button; 