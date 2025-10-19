import React, { useReducer, createContext, useContext, useEffect } from 'react';

// --- Global Types and Interfaces ---

/**
 * @interface ChallengeExample
 * @description Represents an example for a coding challenge, detailing input, output, and optional explanation.
 */
export interface ChallengeExample {
  input: string;
  output: string;
  explanation?: string;
}

/**
 * @interface Challenge
 * @description Defines the structure of an AI-generated coding challenge, parsed from markdown.
 *              Includes an ID, title, problem statement, examples, constraints, and the full original markdown.
 */
export interface Challenge {
  id: string;
  title: string;
  problemStatement: string;
  examples: ChallengeExample[];
  constraints: string[];
  fullMarkdown: string; // Keep the original markdown for rendering flexibility
}

/**
 * @interface AppState
 * @description Defines the global state structure for the application, managed by the AppContext.
 *              Includes the current challenge, loading status, error messages, and theme preference.
 */
export interface AppState {
  currentChallenge: Challenge | null;
  isLoading: boolean;
  error: string | null;
  theme: 'light' | 'dark';
}

/**
 * @enum ActionType
 * @description Enumerates all possible action types for the `appReducer`, ensuring type safety and clarity in state transitions.
 */
export enum ActionType {
  FETCH_START = 'FETCH_START',
  FETCH_SUCCESS = 'FETCH_SUCCESS',
  FETCH_ERROR = 'FETCH_ERROR',
  SET_THEME = 'SET_THEME',
  // GENERATE_NEW_CHALLENGE is subsumed by FETCH_SUCCESS with a new payload
}

/**
 * @type Action
 * @description A discriminated union type for all actions that can be dispatched to the `appReducer`.
 *              Each action carries a specific type and optionally a payload.
 */
export type Action =
  | { type: ActionType.FETCH_START }
  | { type: ActionType.FETCH_SUCCESS; payload: Challenge }
  | { type: ActionType.FETCH_ERROR; payload: string }
  | { type: ActionType.SET_THEME; payload: 'light' | 'dark' };

// --- Global State Management (Context API) ---

/**
 * @const initialState
 * @description The initial state for the application's global context.
 */
const initialState: AppState = {
  currentChallenge: null,
  isLoading: false,
  error: null,
  theme: 'light', // Default theme on first load
};

/**
 * @function appReducer
 * @param {AppState} state - The current application state.
 * @param {Action} action - The action to be dispatched.
 * @returns {AppState} - The new application state.
 * @description A reducer function to manage state transitions for the global AppContext,
 *              handling actions like fetching data, setting errors, and changing themes.
 */
function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case ActionType.FETCH_START:
      return { ...state, isLoading: true, error: null }; // Clear previous errors on new fetch
    case ActionType.FETCH_SUCCESS:
      return { ...state, isLoading: false, error: null, currentChallenge: action.payload };
    case ActionType.FETCH_ERROR:
      return { ...state, isLoading: false, error: action.payload, currentChallenge: null }; // Clear challenge on error
    case ActionType.SET_THEME:
      return { ...state, theme: action.payload };
    default:
      // Fallback for unknown actions, typically logs an error in development
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Unhandled action type: ${(action as any).type}`);
      }
      return state;
  }
}

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
 */
export const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * @function useAppContext
 * @returns {AppContextType} - The application context (state and dispatch).
 * @throws {Error} - If `useAppContext` is called outside of an `AppProvider`.
 * @description A custom hook to easily consume the `AppContext`, enforcing its usage within `AppProvider`.
 */
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

/**
 * @component AppProvider
 * @param {React.PropsWithChildren<{}>} props - React children to be rendered within the provider.
 * @description A React component that wraps its children with the `AppContext.Provider`, making
 *              the global state and dispatch available to all nested components. It also handles
 *              persisting and loading the theme from `localStorage`.
 */
export const AppProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Effect to load theme from local storage on initial mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('appTheme') as 'light' | 'dark';
    if (savedTheme && savedTheme !== state.theme) {
      dispatch({ type: ActionType.SET_THEME, payload: savedTheme });
    }
  }, []); // Empty dependency array means this runs once on mount

  // Effect to save theme to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('appTheme', state.theme);
  }, [state.theme]); // Runs when state.theme changes

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};