import React from 'react';
import { useDesignSystem } from '@/design_system/DesignSystemProvider';
import { Header } from './Header';
import { Footer } from './Footer';

export const AppShell = ({ children }) => {
  const { darkMode, dir } = useDesignSystem();

  return (
    <div 
      className={`min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200 ${darkMode ? 'dark' : 'light'}`} 
      dir={dir}
      lang="ar"
    >
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};
