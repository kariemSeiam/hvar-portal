import React, { useState, useMemo } from 'react';

const Tabs = ({ 
  tabs, 
  activeTab, 
  onTabChange, 
  variant = 'default',
  size = 'md',
  className = '',
  ...props 
}) => {
  const variants = {
    default: {
      container: 'border-b border-gray-200',
      tab: 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
      active: 'border-blue-500 text-blue-600'
    },
    pills: {
      container: 'space-x-1 space-x-reverse',
      tab: 'rounded-lg px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100',
      active: 'bg-blue-100 text-blue-700'
    },
    underline: {
      container: 'border-b border-gray-200',
      tab: 'border-b-2 border-transparent text-gray-600 hover:text-gray-800',
      active: 'border-indigo-500 text-indigo-600'
    },
    modern: {
      container: 'bg-white rounded-xl shadow-sm border border-gray-100 p-1',
      tab: 'relative rounded-lg px-4 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200',
      active: 'bg-gradient-to-r from-brand-red-500 to-brand-red-600 text-white shadow-lg transform scale-105'
    },
    compact: {
      container: 'bg-gray-50 rounded-lg p-1',
      tab: 'relative rounded-md px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-white transition-all duration-150',
      active: 'bg-white text-brand-red-600 shadow-sm border border-gray-200'
    },
    glass: {
      container: 'bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-1',
      tab: 'relative rounded-lg px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200',
      active: 'bg-brand-red-600 text-white shadow-sm'
    }
  };

  // Responsive sizes with touch-friendly targets
  const sizes = {
    sm: 'text-xs sm:text-xs px-3 sm:px-2 py-2 sm:py-1.5 min-h-[44px] sm:min-h-[36px]',
    md: 'text-sm sm:text-sm px-4 sm:px-3 py-2.5 sm:py-2 min-h-[44px] sm:min-h-[40px]',
    lg: 'text-base sm:text-base px-5 sm:px-4 py-3 sm:py-3 min-h-[48px] sm:min-h-[44px]'
  };

  const currentVariant = variants[variant];

  // Memoize tab rendering for performance
  const renderedTabs = useMemo(() => {
    return tabs.map((tab) => {
      const isActive = activeTab === tab.id;
      const hasBadge = tab.badge && tab.badge !== '0';
      
      return (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            ${currentVariant.tab}
            ${isActive ? currentVariant.active : ''}
            ${sizes[size]}
            font-cairo font-medium transition-all duration-200
            focus:outline-none
            group relative overflow-hidden
            ${isActive ? 'z-10' : 'z-0'}
            touch-manipulation active:scale-95
            flex-shrink-0 snap-start
            whitespace-nowrap
          `}
          aria-selected={isActive}
          role="tab"
        >
          {/* Active indicator */}
          {isActive && (
            <div className="absolute inset-0 bg-gradient-to-r from-brand-red-500 to-brand-red-600 rounded-lg opacity-90"></div>
          )}
          
          {/* Content wrapper */}
          <div className="relative z-10 flex items-center justify-center space-x-2 space-x-reverse">
            {/* Icon */}
            {tab.icon && (
              <span className={`
                transition-all duration-200
                ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}
              `}>
                {tab.icon}
              </span>
            )}
            
            {/* Label */}
            <span className={`
              transition-all duration-200 font-medium
              ${isActive ? 'text-white' : 'text-gray-700 group-hover:text-gray-900'}
            `}>
              {tab.label}
            </span>
            
            {/* Badge - Mobile optimized sizing */}
            {hasBadge && (
              <span className={`
                inline-flex items-center justify-center min-w-[1.5rem] sm:min-w-[1.25rem] h-6 sm:h-5 px-2 sm:px-1.5 rounded-full text-xs font-bold transition-all duration-200 flex-shrink-0
                ${isActive
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'bg-brand-red-100 text-brand-red-700 group-hover:bg-brand-red-200'
                }
              `}>
                {tab.badge}
              </span>
            )}
          </div>
          
          {/* Hover effect */}
          {!isActive && (
            <div className="absolute inset-0 bg-gradient-to-r from-brand-red-500/10 to-brand-red-600/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          )}
        </button>
      );
    });
  }, [tabs, activeTab, currentVariant, sizes, size]);

  return (
    <div
      className={`${currentVariant.container} ${className} overflow-hidden`}
      role="tablist"
      aria-label="Order management tabs"
      {...props}
    >
      <nav className="flex space-x-1.5 sm:space-x-1 space-x-reverse overflow-x-auto overflow-y-hidden scrollbar-hide pb-0.5 -mb-0.5 snap-x snap-mandatory scroll-smooth" aria-label="Tabs">
        {renderedTabs}
      </nav>
    </div>
  );
};

export default Tabs; 