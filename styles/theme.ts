/**
 * @file styles/theme.ts
 * @description Centralizes theme definitions, color palettes for light and dark modes,
 *              and related types to ensure consistent styling across the application.
 *              This module promotes reusability and maintainability of theme-related constants.
 */

// Copyright James Burvel OÃ¢â‚¬â„¢Callaghan III
// President Citibank Demo Business Inc.

/**
 * @type ThemeName
 * @description Defines the possible names for application themes.
 */
export type ThemeName = 'light' | 'dark';

/**
 * @interface ThemeProps
 * @description Defines props for styled components that require access to the current theme (light' or 'dark').
 */
export interface ThemeProps {
  theme: ThemeName;
}

/**
 * @const themeColors
 * @description A collection of color palettes for light and dark themes, promoting consistent styling.
 */
export const themeColors = {
  light: {
    background: '#f8f9fa',
    text: '#212529',
    primary: '#007bff', // Bootstrap primary blue
    secondary: '#6c757d', // Bootstrap secondary grey
    border: '#dee2e6',
    cardBackground: '#ffffff',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    background: '#212529', // Dark background
    text: '#f8f9fa', // Light text
    primary: '#6ab04c', // A friendly green for dark mode elements
    secondary: '#adb5bd', // Lighter grey for secondary text
    border: '#495057',
    cardBackground: '#343a40',
    shadow: 'rgba(0, 0, 0, 0.4)',
  },
};