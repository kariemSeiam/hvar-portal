import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggle = () => {
  const { isDark, toggleTheme, resetToSystemTheme } = useTheme();
  const [showOptions, setShowOptions] = useState(false);

  const handleThemeChange = (newTheme) => {
    if (newTheme === 'system') {
      resetToSystemTheme();
    } else {
      toggleTheme();
    }
    setShowOptions(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={isDark ? 'تبديل إلى الوضع الفاتح' : 'تبديل إلى الوضع الداكن'}
        aria-pressed={isDark}
        onClick={() => setShowOptions(!showOptions)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-cairo transition-all duration-200 border
                   bg-white text-gray-700 hover:bg-gray-50 border-gray-200 hover:shadow-sm
                   dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 dark:border-gray-600 dark:hover:shadow-lg"
      >
        {isDark ? (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3v2m0 14v2m7-9h2M3 12H1m15.364-6.364l1.414 1.414M6.222 17.778l-1.414 1.414m0-12.728l1.414 1.414M18.778 17.778l-1.414-1.414" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        )}
        <span>{isDark ? 'فاتح' : 'داكن'}</span>
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${showOptions ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Theme Options Dropdown */}
      {showOptions && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="py-1">
            <button
              onClick={() => handleThemeChange('light')}
              className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3v2m0 14v2m7-9h2M3 12H1m15.364-6.364l1.414 1.414M6.222 17.778l-1.414 1.414m0-12.728l1.414 1.414M18.778 17.778l-1.414-1.414" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <span>الوضع الفاتح</span>
            </button>

            <button
              onClick={() => handleThemeChange('dark')}
              className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>الوضع الداكن</span>
            </button>

            <button
              onClick={() => handleThemeChange('system')}
              className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>نظام التشغيل</span>
            </button>
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {showOptions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowOptions(false)}
        />
      )}
    </div>
  );
};

export default ThemeToggle;


