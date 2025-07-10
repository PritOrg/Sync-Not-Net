import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from '../theme';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Always use light theme
  const isDarkMode = false;

  const toggleTheme = () => {
    // No-op since we only support light theme
  };

  const setTheme = (mode) => {
    // No-op since we only support light theme
  };

  const getCurrentTheme = () => {
    return lightTheme;
  };

  const value = {
    isDarkMode: false,
    toggleTheme,
    setTheme,
    systemPreference: 'light',
    currentTheme: lightTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={lightTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
