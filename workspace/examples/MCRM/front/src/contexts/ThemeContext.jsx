import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import useRTL from '../hooks/useRTL';

// Create the theme context
const ThemeContext = createContext(null);

// Theme storage key
const THEME_STORAGE_KEY = 'hvar-theme';

// System theme detection
const getSystemTheme = () => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

// Theme provider component
export const ThemeProvider = ({ children, initialTheme = 'light', initialRTL = true }) => {
  // Initialize theme from localStorage or system preference
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return initialTheme;

    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }

      // Fallback to system preference
      return getSystemTheme();
    } catch (error) {
      console.warn('Failed to read theme from localStorage:', error);
      return initialTheme;
    }
  });

  // RTL support
  const rtlSupport = useRTL(initialRTL);

  // Update theme class on document and save to localStorage
  useEffect(() => {
    try {
      // Update DOM
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // Save to localStorage
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  }, [theme]);

  // Cross-tab synchronization
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === THEME_STORAGE_KEY && e.newValue !== theme) {
        if (e.newValue === 'light' || e.newValue === 'dark') {
          setTheme(e.newValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [theme]);

  // System theme change detection
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e) => {
      // Only update if no user preference is stored
      try {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        if (!savedTheme) {
          setTheme(e.matches ? 'dark' : 'light');
        }
      } catch (error) {
        console.warn('Failed to check theme preference:', error);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  // Toggle theme function
  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  }, []);

  // Set theme explicitly
  const setThemeExplicitly = useCallback((newTheme) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      setTheme(newTheme);
    }
  }, []);

  // Reset to system theme
  const resetToSystemTheme = useCallback(() => {
    const systemTheme = getSystemTheme();
    setTheme(systemTheme);
  }, []);

  // Context value
  const contextValue = {
    theme,
    toggleTheme,
    setTheme: setThemeExplicitly,
    resetToSystemTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    ...rtlSupport
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};

export default ThemeContext; 