import React, { createContext, useContext, useState, useEffect } from 'react';

// Create context
const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Check for system preference or saved preference
  const getInitialTheme = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved;
      
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    }
    
    // Default to light theme
    return 'light';
  };
  
  const [theme, setTheme] = useState('light');
  
  // Initialize theme on component mount
  useEffect(() => {
    setTheme(getInitialTheme());
  }, []);
  
  // Update theme when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement;
      
      // Remove old theme class
      root.classList.remove('light', 'dark');
      
      // Add new theme class
      root.classList.add(theme);
      
      // Save to localStorage
      localStorage.setItem('theme', theme);
    }
  }, [theme]);
  
  // Toggle between light and dark
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };
  
  // Set theme directly
  const setThemeMode = (mode) => {
    if (mode === 'light' || mode === 'dark') {
      setTheme(mode);
    }
  };
  
  const value = {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setTheme: setThemeMode
  };
  
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
