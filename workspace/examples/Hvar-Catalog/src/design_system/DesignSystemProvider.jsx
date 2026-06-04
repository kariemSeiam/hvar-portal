import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const DesignSystemContext = createContext({
  darkMode: false,
  setDarkMode: () => {},
  dir: 'rtl',
  setDir: () => {},
});

export function useDesignSystem() {
  return useContext(DesignSystemContext);
}

export function DesignSystemProvider({ children, initialDarkMode, dir = 'rtl' }) {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof initialDarkMode === 'boolean') return initialDarkMode;
    if (typeof window !== 'undefined') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [direction, setDirection] = useState(dir);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const html = document.documentElement;
      html.dir = direction || 'rtl';
    }
  }, [direction]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const html = document.documentElement;
      html.classList.toggle('dark', darkMode);
    }
  }, [darkMode]);

  const value = useMemo(
    () => ({ darkMode, setDarkMode, dir: direction, setDir: setDirection }),
    [darkMode, direction]
  );

  return (
    <DesignSystemContext.Provider value={value}>
      <div>{children}</div>
    </DesignSystemContext.Provider>
  );
}


