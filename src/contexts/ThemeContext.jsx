import { createContext, useContext, useState, useEffect } from 'react';

// Create the ThemeContext for theme state management
const ThemeContext = createContext();

// Custom hook to access the ThemeContext
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// ThemeProvider component to wrap the app and provide theme state
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light'); // Default theme is 'light'

  // On mount, check localStorage or system preference for theme
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      setTheme(storedTheme); // if not stored
    } else{
      setTheme('light'); // Use default light mode
    }
  }, []);

  // Update document class and localStorage when theme changes
  useEffect(() => {
    const root = document.documentElement; // <HTML>
    if (theme === 'dark') {
      root.classList.add('dark'); // Add 'dark' class for dark mode styling
    } else {
      root.classList.remove('dark'); // Remove 'dark' class for light mode
    }
    localStorage.setItem('theme', theme); // Persist theme selection
  }, [theme]);

  // Function to toggle between light and dark themes
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Context value to be provided to consumers
  const value = {
    theme,
    toggleTheme
  };

  // Provide the context to child components
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

