import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/tailwind';
import { 
  Plus, 
  RotateCcw, 
  PackageX, 
  Wrench, 
  Package, 
  ChevronUp,
  X,
  Settings,
  RefreshCw,
  Truck
} from 'lucide-react';

/**
 * Enhanced FloatingActionButton (FAB) component with creative menu
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.icon - Icon to display in the button
 * @param {string} [props.variant='primary'] - Button variant (primary, secondary, outline)
 * @param {string} [props.size='md'] - Button size (sm, md, lg)
 * @param {string} [props.position='bottom-end'] - Position on screen (bottom-end, bottom-start, bottom-center)
 * @param {boolean} [props.disabled=false] - Whether button is disabled
 * @param {function} props.onClick - Click handler
 * @param {string} [props.className] - Additional classes
 * @param {string} [props.tooltip] - Tooltip text
 * @param {boolean} [props.showMenu=false] - Whether to show the service menu
 * @param {Array} [props.menuItems] - Menu items to display
 * @param {function} [props.onMenuItemClick] - Handler for menu item clicks
 */
const FloatingActionButton = ({
  icon,
  variant = 'primary',
  size = 'md',
  position = 'bottom-end',
  disabled = false,
  onClick,
  className = '',
  tooltip,
  showMenu = false,
  menuItems = [],
  onMenuItemClick,
  ...props
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Variant styles
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-brand-red-600 text-white hover:bg-brand-red-700 focus:ring-brand-red-500';
      case 'secondary':
        return 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 focus:ring-gray-500 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700';
      case 'outline':
        return 'bg-transparent border border-brand-red-600 text-brand-red-600 hover:bg-brand-red-50 focus:ring-brand-red-500 dark:hover:bg-brand-red-900/20';
      default:
        return 'bg-brand-red-600 text-white hover:bg-brand-red-700 focus:ring-brand-red-500';
    }
  };

  // Size styles
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-9 w-9 text-xs';
      case 'md':
        return 'h-12 px-4 text-sm';
      case 'lg':
        return 'h-14 px-5 text-base';
      default:
        return 'h-12 px-4';
    }
  };

  // Position styles
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-start':
        return 'bottom-6 start-6';
      case 'bottom-center':
        return 'bottom-6 left-1/2 -translate-x-1/2';
      case 'bottom-end':
      default:
        return 'bottom-6 end-6';
    }
  };

  const handleMainButtonClick = () => {
    if (showMenu) {
      setIsMenuOpen(!isMenuOpen);
    } else if (onClick) {
      onClick();
    }
  };

  const handleMenuItemClick = (item) => {
    setIsMenuOpen(false);
    if (onMenuItemClick) {
      onMenuItemClick(item);
    }
  };

  return (
    <div className="fixed z-30" style={{ [position.includes('start') ? 'left' : 'right']: '1.5rem', bottom: '1.5rem' }}>
      {/* Service Menu */}
      {showMenu && isMenuOpen && (
        <div 
          ref={menuRef}
          className="absolute bottom-full mb-4 end-0 min-w-[320px] bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          {/* Menu Items */}
          <div className="p-0">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => handleMenuItemClick(item)}
                className="w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
              >
                {/* Icon */}
                <div className={`p-2 rounded-lg ${item.iconBg || 'bg-brand-red-50 dark:bg-brand-red-900/20'}`}>
                  {item.icon}
                </div>
                
                {/* Content */}
                <div className="flex-1 text-right">
                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                    {item.label}
                  </div>
                  {item.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {item.description}
                    </div>
                  )}
                </div>

                {/* Badge if exists */}
                {item.badge && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.badgeColor || 'bg-brand-red-100 text-brand-red-700 dark:bg-brand-red-900/30 dark:text-brand-red-300'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main FAB Button */}
      <button
        className={cn(
          'rounded-full shadow-lg flex items-center justify-center transition-all duration-300',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'hover:shadow-xl hover:scale-105',
          getVariantClasses(),
          getSizeClasses(),
          disabled && 'opacity-60 pointer-events-none',
          className
        )}
        onClick={handleMainButtonClick}
        disabled={disabled}
        aria-label={tooltip}
        title={tooltip}
        {...props}
      >
        {isMenuOpen ? (
          <div className="flex items-center gap-2">
            <X size={18} />
            <span className="text-sm font-semibold">إغلاق</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-semibold">خدمات</span>
          </div>
        )}
      </button>
    </div>
  );
};

export default FloatingActionButton; 