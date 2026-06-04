import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Theme context containing theme state and controls
 */
const ThemeContext = createContext({
  direction: 'rtl',
  theme: 'light',
  isDark: false,
  toggleDirection: () => {},
  toggleTheme: () => {},
});

/**
 * Hook for using the theme context
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Theme provider component for dark mode and RTL direction
 */
const ThemeProvider = ({ 
  children,
  defaultDirection = 'rtl',
  defaultTheme = 'light'
}) => {
  // Get initial values from localStorage or use defaults
  const [direction, setDirection] = useState(() => {
    const savedDirection = localStorage.getItem('direction');
    return savedDirection || defaultDirection;
  });
  
  const [theme, setTheme] = useState(() => {
    // Check for user preference in localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    
    // Check for system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    // Fall back to default
    return defaultTheme;
  });
  
  // Toggle direction between RTL and LTR
  const toggleDirection = () => {
    const newDirection = direction === 'rtl' ? 'ltr' : 'rtl';
    setDirection(newDirection);
    localStorage.setItem('direction', newDirection);
  };
  
  // Toggle theme between light and dark
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };
  
  // Apply direction and theme to document
  useEffect(() => {
    // Set direction
    document.documentElement.dir = direction;
    document.documentElement.lang = direction === 'rtl' ? 'ar' : 'en';
    
    // Set theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [direction, theme]);
  
  // Context value
  const contextValue = {
    direction,
    theme,
    isDark: theme === 'dark',
    toggleDirection,
    toggleTheme,
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider; 