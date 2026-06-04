import React, { useState, useRef, useEffect } from 'react';
import { Bell, ChevronDown, LogOut, Menu, Moon, Settings, Sun, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/tailwind';
import { Button } from '../ui';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../ui/ThemeProvider';

/**
 * Main header component for the application
 * Fully redesigned with DNA patterns
 * 
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {string} [props.subtitle] - Page subtitle (appears below title)
 * @param {Function} props.setIsMobileMenuOpen - Mobile menu toggle handler
 * @param {Array} [props.breadcrumbs=[]] - Breadcrumb items
 * @param {React.ReactNode} [props.actions=null] - Custom action buttons
 */
const Header = ({ 
  title, 
  subtitle,
  setIsMobileMenuOpen, 
  breadcrumbs = [],
  actions = null
}) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notificationsRef = useRef(null);
  const profileRef = useRef(null);
  
  // Get user initials for avatar (DNA pattern)
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 1).toUpperCase();
  };
  
  const userName = user?.name || 'مستخدم';
  const userEmail = user?.email || '';
  const userRole = user?.role || 'operator';
  const userInitials = getInitials(userName);
  
  // Role labels (DNA Arabic labels)
  const roleLabels = {
    'call-center': 'خدمة العملاء',
    'operator': 'مشغل / محاسب',
    'manager': 'مدير / قائد فريق',
  };
  
  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <header 
      className={cn(
        // Base styles (DNA colors and spacing)
        'bg-white dark:bg-gray-900',
        'border-b border-gray-200 dark:border-gray-800',
        'h-16 flex items-center justify-between',
        'px-4 md:px-6',
        'sticky top-0 z-50',
        'backdrop-blur-sm bg-white/95 dark:bg-gray-900/95', // DNA glass effect
        'transition-all duration-300' // DNA NORMAL timing
      )}
    >
      {/* Left Section: Mobile Menu + Title + Breadcrumbs */}
      <div className="flex items-center min-w-0">
        {/* Mobile menu toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={cn(
            'lg:hidden p-2 rounded-md flex-shrink-0',
            'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300',
            'hover:bg-gray-100 dark:hover:bg-gray-800',
            'transition-all duration-300', // DNA NORMAL
            'hover:scale-105 active:scale-95', // DNA micro-interactions
            'focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:ring-offset-2'
          )}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        
        {/* Title and breadcrumbs container */}
        <div className={cn(
          'flex items-center gap-2',
          'min-w-0', // Allow truncation
          'ml-3 lg:ml-4', // RTL: proper spacing from mobile menu
          'flex-shrink' // Allow shrinking to prevent gap
        )}>
          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400 leading-none flex-shrink-0" aria-label="Breadcrumb">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  {index > 0 && (
                    <span className="mx-2 text-gray-400 dark:text-gray-600" aria-hidden="true">/</span>
                  )}
                  {crumb.link ? (
                    <a 
                      href={crumb.link} 
                      className={cn(
                        'hover:text-gray-700 dark:hover:text-gray-300',
                        'transition-colors duration-300', // DNA NORMAL
                        'focus:outline-none focus:underline'
                      )}
                    >
                      {crumb.text}
                    </a>
                  ) : (
                    <span className="text-gray-600 dark:text-gray-400">{crumb.text}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}
          
          {/* Page Title and Subtitle */}
          <div className="flex flex-col min-w-0">
            <h1 className={cn(
              'text-xl font-bold text-gray-900 dark:text-white',
              'leading-tight', // Better line height
              'font-cairo', // DNA HEAD font
              'truncate' // Prevent overflow
            )}>
              {title}
            </h1>
            {subtitle && (
              <p className={cn(
                'text-sm text-gray-500 dark:text-gray-400',
                'mt-0.5', // DNA spacing (2px)
                'font-tajawal', // DNA BODY font
                'truncate' // Prevent overflow
              )}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Right Section: Actions + Notifications + Profile */}
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 ml-4">
        {/* Custom actions */}
        {actions && (
          <div className="hidden sm:flex items-center gap-2">
            {actions}
          </div>
        )}
        
        {/* Notifications Button with Dropdown */}
        <div className="relative" ref={notificationsRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={cn(
              'relative p-2 rounded-full',
              'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300',
              'hover:bg-gray-100 dark:hover:bg-gray-800',
              'transition-all duration-300', // DNA NORMAL
              'hover:scale-105 active:scale-95', // DNA micro-interactions
              'focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:ring-offset-2'
            )}
            aria-label="Notifications"
            aria-expanded={showNotifications}
          >
            <Bell size={20} />
            {/* Notification badge (DNA P1 color) */}
            <span className="absolute top-1 end-1 h-2.5 w-2.5 rounded-full bg-brand-red-600 border-2 border-white dark:border-gray-900"></span>
          </button>
          
          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className={cn(
              'absolute end-0 mt-2 w-80 rounded-lg shadow-xl', // DNA shadow-xl
              'bg-white dark:bg-gray-800',
              'border border-gray-200 dark:border-gray-700',
              'backdrop-blur-sm', // DNA glass effect
              'animate-fade-in', // DNA animation
              'z-50'
            )}>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white font-cairo">
                  الإشعارات
                </h3>
              </div>
              <div className="max-h-96 overflow-y-auto scrollbar-hide">
                <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  لا توجد إشعارات جديدة
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Profile Menu with Dropdown */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={cn(
              'flex items-center gap-2',
              'text-gray-700 dark:text-gray-300',
              'hover:bg-gray-100 dark:hover:bg-gray-800',
              'rounded-full transition-all duration-300', // DNA NORMAL
              'hover:scale-105 active:scale-95', // DNA micro-interactions
              'p-1 pr-2',
              'focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:ring-offset-2'
            )}
            aria-label="Profile menu"
            aria-expanded={showProfileMenu}
          >
            {/* User Avatar (DNA P1 gradient) */}
            <div className={cn(
              'h-8 w-8 rounded-full',
              'bg-gradient-to-br from-brand-red-500 to-brand-red-700', // DNA P1 gradient
              'text-white flex items-center justify-center',
              'text-sm font-semibold leading-none',
              'font-cairo', // DNA HEAD font for initials
              'shadow-md' // DNA shadow-md
            )}>
              {userInitials}
            </div>
            
            {/* User Name (hidden on mobile) */}
            <span className="hidden sm:block text-sm font-medium leading-none font-tajawal">
              {userName}
            </span>
            
            <ChevronDown 
              size={16} 
              className={cn(
                'text-gray-500 dark:text-gray-400',
                'transition-transform duration-300', // DNA NORMAL
                showProfileMenu && 'rotate-180'
              )}
            />
          </button>
          
          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className={cn(
              'absolute end-0 mt-2 w-64 rounded-lg shadow-xl', // DNA shadow-xl
              'bg-white dark:bg-gray-800',
              'border border-gray-200 dark:border-gray-700',
              'backdrop-blur-sm', // DNA glass effect
              'animate-fade-in', // DNA animation
              'z-50'
            )}>
              {/* User Info Section */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'h-10 w-10 rounded-full',
                    'bg-gradient-to-br from-brand-red-500 to-brand-red-700', // DNA P1 gradient
                    'text-white flex items-center justify-center',
                    'text-sm font-semibold font-cairo',
                    'shadow-md' // DNA shadow-md
                  )}>
                    {userInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white font-cairo truncate">
                      {userName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-tajawal truncate">
                      {userEmail}
                    </p>
                    {userRole && (
                      <span className={cn(
                        'inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium',
                        'bg-brand-red-50 dark:bg-brand-red-900/20',
                        'text-brand-red-700 dark:text-brand-red-300'
                      )}>
                        {roleLabels[userRole] || userRole}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Menu Items */}
              <div className="p-2">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    // Navigate to settings if route exists
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md',
                    'text-sm text-gray-700 dark:text-gray-300',
                    'hover:bg-gray-100 dark:hover:bg-gray-700',
                    'transition-colors duration-300', // DNA NORMAL
                    'focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:ring-offset-2'
                  )}
                >
                  <Settings size={16} />
                  <span className="font-tajawal">الإعدادات</span>
                </button>
                
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    toggleTheme();
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md',
                    'text-sm text-gray-700 dark:text-gray-300',
                    'hover:bg-gray-100 dark:hover:bg-gray-700',
                    'transition-colors duration-300', // DNA NORMAL
                    'focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:ring-offset-2'
                  )}
                >
                  {isDark ? (
                    <>
                      <Sun size={16} />
                      <span className="font-tajawal">الوضع المضيء</span>
                    </>
                  ) : (
                    <>
                      <Moon size={16} />
                      <span className="font-tajawal">الوضع الداكن</span>
                    </>
                  )}
                </button>
                
                <div className="my-1 border-t border-gray-200 dark:border-gray-700"></div>
                
                <button
                  onClick={handleLogout}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md',
                    'text-sm text-red-600 dark:text-red-400',
                    'hover:bg-red-50 dark:hover:bg-red-900/20',
                    'transition-colors duration-300', // DNA NORMAL
                    'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
                  )}
                >
                  <LogOut size={16} />
                  <span className="font-tajawal">تسجيل الخروج</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

/**
 * Header action button component
 * DNA-compliant wrapper for header actions
 */
export const HeaderAction = ({ children, icon, variant = 'outline', ...props }) => {
  return (
    <Button
      variant={variant}
      size="sm"
      className="hidden sm:flex"
      leftIcon={icon}
      {...props}
    >
      {children}
    </Button>
  );
};

Header.displayName = 'Header';

export default Header;
