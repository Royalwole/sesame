import React, { createContext, useContext, useState, useEffect } from "react";
import { useHydration } from "../lib/useHydration";

// Create context
const ThemeContext = createContext({
  theme: "light",
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const isHydrated = useHydration();

  // Update theme on component mount
  useEffect(() => {
    if (!isHydrated) return;

    // Get stored theme or system preference
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme) {
      setTheme(storedTheme);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  }, [isHydrated]);

  // Update localStorage and document class when theme changes
  useEffect(() => {
    if (!isHydrated) return;

    localStorage.setItem("theme", theme);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
  }, [theme, isHydrated]);

  // During SSR or before hydration, return default theme
  if (!isHydrated) {
    return (
      <ThemeContext.Provider value={{ theme: "light", setTheme: () => {} }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use the theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
