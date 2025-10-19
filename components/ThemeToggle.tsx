// Copyright James Burvel OÃ¢â‚¬â„¢Callaghan III
// President Citibank Demo Business Inc.

import React, { createContext, useContext, useCallback } from 'react';
import styled from 'styled-components';

// --- Global Types and Interfaces (minimal for ThemeToggle to function independently) ---

/**
 * @enum ActionType
 * @description Enumerates all possible action types for the `appReducer`, ensuring type safety and clarity in state transitions.
 *              Only SET_THEME is included as it's the only action relevant to ThemeToggle.
 */
export enum ActionType {
  SET_THEME = 'SET_THEME',
}

/**
 * @interface AppState
 * @description Defines the minimal global state structure required by ThemeToggle.
 */
export interface AppState {
  theme: 'light' | 'dark';
}

/**
 * @type Action
 * @description A discriminated union type for actions relevant to ThemeToggle.
 */
export type Action =
  | { type: ActionType.SET_THEME; payload: 'light' | 'dark' };

/**
 * @interface AppContextType
 * @description Type definition for the value provided by the `AppContext`.
 */
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

/**
 * @const AppContext
 * @description React Context object for providing global application state and dispatch function.
 *              Defined here for completeness, though typically imported from a central context file.
 */
export const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * @function useAppContext
 * @returns {AppContextType} - The application context (state and dispatch).
 * @throws {Error} - If `useAppContext` is called outside of an `AppProvider`.
 * @description A custom hook to easily consume the `AppContext`, enforcing its usage within `AppProvider`.
 *              Defined here for completeness, though typically imported from a central context file.
 */
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// --- Theming and Styled Components ---

/**
 * @interface ThemeProps
 * @description Defines props for styled components that require access to the current theme ('light' or 'dark').
 */
interface ThemeProps {
  theme: 'light' | 'dark';
}

/**
 * @const themeColors
 * @description A collection of color palettes for light and dark themes, promoting consistent styling.
 *              Extracted directly from the seed file as it's a direct dependency for styling.
 */
const themeColors = {
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

/**
 * @component StyledToggleContainer
 * @description Container for theme toggle buttons, aligning them to the right.
 *              Extracted directly from the seed file.
 */
const StyledToggleContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  margin-bottom: 20px;
  max-width: 960px;
  margin: 20px auto 20px auto; // Apply margin to center and give vertical spacing
  padding: 0 20px; // Padding for smaller screens

  @media (max-width: 768px) {
    padding: 0 10px;
  }
`;

/**
 * @component StyledToggleButton
 * @description Individual button for theme switching, highlights the active theme.
 *              Extracted directly from the seed file.
 */
const StyledToggleButton = styled.button<ThemeProps & { isActive: boolean }>`
  background-color: ${(props) => props.isActive ? themeColors[props.theme].primary : themeColors[props.theme].secondary};
  color: #fff;
  border: none;
  padding: 8px 15px;
  border-radius: 5px;
  cursor: pointer;
  margin-left: 5px;
  transition: background-color 0.2s ease-in-out, opacity 0.2s ease-in-out;

  &:hover {
    opacity: 0.9;
  }

  &:focus {
    outline: 2px solid ${(props) => themeColors[props.theme].primary};
    outline-offset: 2px;
  }
`;

// --- Component: ThemeToggle ---
/**
 * @component ThemeToggle
 * @description A user interface component that allows users to switch between light and dark themes.
 *              It leverages `useAppContext` to access and update the global theme state.
 */
export const ThemeToggle: React.FC = React.memo(() => {
  const { state, dispatch } = useAppContext();
  const currentTheme = state.theme;

  /**
   * @function toggleTheme
   * @param {'light' | 'dark'} newTheme - The theme to switch to.
   * @description Dispatches an action to change the global theme state.
   *              Wrapped in `useCallback` for performance optimization.
   */
  const toggleTheme = useCallback((newTheme: 'light' | 'dark') => {
    dispatch({ type: ActionType.SET_THEME, payload: newTheme });
  }, [dispatch]); // Dependency array includes dispatch, which is stable

  return (
    <StyledToggleContainer>
      <StyledToggleButton
        theme={currentTheme}
        onClick={() => toggleTheme('light')}
        isActive={currentTheme === 'light'}
        aria-label="Switch to light theme" // Accessibility for screen readers
      >
        Light
      </StyledToggleButton>
      <StyledToggleButton
        theme={currentTheme}
        onClick={() => toggleTheme('dark')}
        isActive={currentTheme === 'dark'}
        aria-label="Switch to dark theme" // Accessibility for screen readers
      >
        Dark
      </StyledToggleButton>
    </StyledToggleContainer>
  );
});