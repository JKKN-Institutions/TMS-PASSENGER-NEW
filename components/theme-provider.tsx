'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeProviderContext {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'light' | 'dark';
}

const ThemeProviderContext = createContext<ThemeProviderContext | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  attribute?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'theme',
  attribute = 'data-theme',
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>('light');
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');
  
  useEffect(() => {
    // Always use light theme
    setTheme('light');
  }, [storageKey]);

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Always set light theme
    root.setAttribute(attribute, 'light');
    setActualTheme('light');
    
    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#ffffff');
    }
  }, [attribute]);

  const value = {
    theme: 'light' as Theme,
    setTheme: (theme: Theme) => {
      // Do nothing - theme is locked to light mode
    },
    actualTheme: 'light' as 'light' | 'dark',
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};

// Theme-aware component wrapper
interface ThemeAwareProps {
  children: React.ReactNode;
  lightClassName?: string;
  darkClassName?: string;
  className?: string;
}

export const ThemeAware: React.FC<ThemeAwareProps> = ({
  children,
  lightClassName = '',
  darkClassName = '',
  className = '',
}) => {
  const { actualTheme } = useTheme();
  
  const themeClass = actualTheme === 'dark' ? darkClassName : lightClassName;
  const combinedClassName = `${className} ${themeClass}`.trim();
  
  return (
    <div className={combinedClassName}>
      {children}
    </div>
  );
};





