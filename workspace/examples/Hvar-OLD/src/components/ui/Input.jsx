import React, { forwardRef } from 'react';
import { cn } from '../../utils/tailwind';

/**
 * Input component using Tailwind classes directly
 * 
 * @param {Object} props - Input props
 * @param {string} [props.type='text'] - Input type
 * @param {string} [props.label] - Input label
 * @param {string} [props.placeholder] - Input placeholder
 * @param {string} [props.error] - Error message to display
 * @param {string} [props.helperText] - Helper text to display
 * @param {boolean} [props.disabled=false] - Whether input is disabled
 * @param {boolean} [props.required=false] - Whether input is required
 * @param {React.ReactNode} [props.leftIcon] - Icon to show on the left side
 * @param {React.ReactNode} [props.rightIcon] - Icon to show on the right side
 * @param {string} [props.className] - Additional classes to add to the input
 * @param {string} [props.wrapperClassName] - Additional classes to add to the wrapper
 * @param {string} [props.labelClassName] - Additional classes to add to the label
 */
const Input = forwardRef(({
  type = 'text',
  label,
  placeholder,
  error,
  helperText,
  disabled = false,
  required = false,
  leftIcon,
  rightIcon,
  className = '',
  wrapperClassName = '',
  labelClassName = '',
  id,
  ...props
}, ref) => {
  // Generate random ID if not provided
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
  
  // Input base classes
  const baseInputClasses = 'block w-full rounded-md border border-gray-300 px-4 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-brand-red-500 focus:outline-none focus:ring-1 focus:ring-brand-red-500 transition-all duration-150 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-500';
  
  // Error classes
  const errorClasses = error ? 'border-red-500 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-700 dark:text-red-400' : '';
  
  // Disabled classes
  const disabledClasses = disabled ? 'opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-900' : '';
  
  // Icon classes
  const hasLeftIconClasses = leftIcon ? 'pl-10' : '';
  const hasRightIconClasses = rightIcon ? 'pr-10' : '';

  return (
    <div className={cn('w-full', wrapperClassName)}>
      {label && (
        <label 
          htmlFor={inputId}
          className={cn(
            'block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-200', 
            required ? 'after:content-["*"] after:mr-0.5 after:text-red-500' : '',
            error ? 'text-red-500 dark:text-red-400' : '',
            labelClassName
          )}
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 dark:text-gray-400 sm:text-sm">{leftIcon}</span>
          </div>
        )}
        
        <input
          ref={ref}
          type={type}
          id={inputId}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            baseInputClasses,
            errorClasses,
            disabledClasses,
            hasLeftIconClasses,
            hasRightIconClasses,
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 dark:text-gray-400 sm:text-sm">{rightIcon}</span>
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <div className="mt-1.5 text-sm">
          {error && <p className="text-red-500 dark:text-red-400">{error}</p>}
          {helperText && !error && <p className="text-gray-500 dark:text-gray-400">{helperText}</p>}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input; 