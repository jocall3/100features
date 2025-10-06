```tsx
// Copyright James Burvel Oâ€™Callaghan III
// President Citibank Demo Business Inc.

// openapi: 3.1.0
// info:
//   title: AI Coding Challenge Generator API
//   version: 1.0.0
//   description: API for generating unique coding challenges using an AI service.
// servers:
//   - url: https://api.yourdomain.com
//     description: Main API server
// paths:
//   /coding-challenges:
//     get:
//       summary: Generate a new AI coding challenge
//       operationId: generateCodingChallenge
//       description: |
//         Requests the AI service to generate a new and unique coding challenge.
//         Each request for this endpoint should return a newly generated problem.
//         The challenge description is provided in Markdown format.
//       responses:
//         '200':
//           description: Successfully generated a coding challenge.
//           content:
//             text/plain:
//               schema:
//                 type: string
//                 description: The generated coding challenge content in Markdown format.
//                 example: |
//                   # Coding Challenge: Array Deduplication

//                   **Problem Statement:**
//                   Given an array of integers `nums`, remove the duplicates in-place such that each unique element appears only once.
//                   The relative order of the elements should be kept the same.
//                   Since it is impossible to change the length of the array in some languages, you must instead have the result be placed in the first part of the array `nums`.
//                   More formally, if there are `k` elements after removing the duplicates, then the first `k` elements of `nums` should hold the final result.
//                   It does not matter what you leave beyond the first `k` elements.

//                   Return `k` after placing the final result in the first `k` slots of `nums`.

//                   Do not allocate extra space for another array. You must do this by modifying the input array in-place with O(1) extra memory.

//                   **Example 1:**
//                   Input: `nums = [1,1,2]`
//                   Output: `2`, `nums` should be `[1,2,_]` (underscores represent irrelevant values)

//                   **Example 2:**
//                   Input: `nums = [0,0,1,1,1,2,2,3,3,4]`
//                   Output: `5`, `nums` should be `[0,1,2,3,4,_,_,_,_,_]`

//                   **Constraints:**
//                   * `0 <= nums.length <= 3 * 10^4`
//                   * `-100 <= nums[i] <= 100`
//                   * `nums` is sorted in non-decreasing order.
//         '500':
//           description: Internal server error, unable to generate the challenge.
//           content:
//             application/json:
//               schema:
//                 type: object
//                 properties:
//                   error:
//                     type: string
//                     description: A message describing the error.
//                     example: Failed to generate challenge: AI service is unavailable.


// app.tsx
//
// This file represents a single-page React application for generating AI Coding Challenges.
// It integrates the concepts described in the provided OpenAPI specification (AiCodingChallenge.tsx)
// into a functional, production-ready React frontend.
//
// Goal: Create a polished, enterprise-grade React application that demonstrates best practices.
//
// Features include:
// - Fetches and displays AI-generated coding challenges (simulated API call based on OpenAPI spec).
// - Manages loading and error states for asynchronous API operations.
// - Implements a simple user interface for requesting new challenges.
// - Uses TypeScript for strong typing throughout the application, enhancing maintainability and scalability.
// - Incorporates basic global state management using React's Context API and useReducer.
// - Includes an Error Boundary for robust UI rendering and gracefully handling unexpected errors.
// - Employs responsive styling using `styled-components` (CSS-in-JS) for a consistent and adaptable UI.
// - Adheres to accessibility best practices (semantic HTML, ARIA attributes for interactive elements).
// - Uses `React.memo` for performance optimizations to prevent unnecessary re-renders of static components.
// - Provides basic SEO metadata management using `react-helmet-async` for dynamic page titles and descriptions.
// - Structured with clear comments to delineate logical sections and components within this single file,
//   simulating a folder-like organization for clarity.
//
// Dependencies: React, react-dom (standard React environment), styled-components, react-helmet-async, react-markdown, remark-gfm.
// The API calls are mocked for demonstration purposes, simulating interactions with the API described
// in the OpenAPI specification. In a real application, these would interact with an actual backend.

import React, { useState, useEffect, useCallback, useReducer, createContext, useContext, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom'; // Included for completeness, though not strictly used in this specific app
import styled from 'styled-components'; // A common CSS-in-JS library for styling
import { HelmetProvider, Helmet } from 'react-helmet-async'; // For managing document head (SEO)
import Markdown from 'react-markdown'; // For rendering markdown content from the API
import remarkGfm from 'remark-gfm'; // Plugin for Github Flavored Markdown to support tables, task lists, etc.

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

// --- Utility Functions and Helpers ---

/**
 * @function parseMarkdownChallenge
 * @param {string} markdownContent - The raw markdown string obtained from the simulated API.
 * @returns {Challenge} - A structured `Challenge` object after parsing the markdown.
 * @description This function parses the raw markdown content into a structured `Challenge` object.
 *              It's designed to extract specific sections like title, problem statement, examples,
 *              and constraints based on expected markdown headings and formatting from the OpenAPI example.
 */
export const parseMarkdownChallenge = (markdownContent: string): Challenge => {
  const lines = markdownContent.split('\n');
  let title = 'Untitled Challenge';
  let problemStatement = '';
  const examples: ChallengeExample[] = [];
  const constraints: string[] = [];

  let mode: 'title' | 'problem' | 'examples' | 'constraints' | 'none' = 'none';
  let currentExample: Partial<ChallengeExample> = {};

  for (const line of lines) {
    if (line.startsWith('# Coding Challenge:')) {
      title = line.replace('# Coding Challenge:', '').trim();
      mode = 'problem';
      continue;
    }
    if (line.startsWith('**Problem Statement:**')) {
      mode = 'problem';
      continue;
    }
    if (line.startsWith('**Example ')) {
      // Before starting a new example, push the previous one if complete
      if (currentExample.input && currentExample.output) {
        examples.push(currentExample as ChallengeExample);
      }
      currentExample = {}; // Reset for the new example
      mode = 'examples';
      continue;
    }
    if (line.startsWith('**Constraints:**')) {
      // Push the last example before switching to constraints mode
      if (currentExample.input && currentExample.output) {
        examples.push(currentExample as ChallengeExample);
      }
      mode = 'constraints';
      continue;
    }

    // Accumulate content based on the current parsing mode
    if (mode === 'problem' && !line.startsWith('**Example ') && !line.startsWith('**Constraints:**')) {
      problemStatement += line + '\n';
    } else if (mode === 'examples') {
      if (line.startsWith('Input:')) {
        currentExample.input = line.replace('Input:', '').trim();
      } else if (line.startsWith('Output:')) {
        currentExample.output = line.replace('Output:', '').trim();
      } else if (line.includes('(') && line.includes('underscores represent irrelevant values')) {
        currentExample.explanation = line.trim();
      }
    } else if (mode === 'constraints' && line.trim().startsWith('*')) {
      constraints.push(line.replace('*', '').trim());
    }
  }

  // Ensure any final example is pushed
  if (currentExample.input && currentExample.output) {
    examples.push(currentExample as ChallengeExample);
  }

  return {
    id: `challenge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Unique ID generation
    title,
    problemStatement: problemStatement.trim(),
    examples,
    constraints,
    fullMarkdown: markdownContent,
  };
};

/**
 * @function mockFetchCodingChallenge
 * @description Simulates an API call to fetch a coding challenge. This function mimics network latency
 *              and potential errors as described in the OpenAPI specification, returning a markdown string.
 */
export const mockFetchCodingChallenge = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate a network error approximately 10% of the time for robustness testing
      if (Math.random() < 0.1) {
        reject(new Error('Failed to generate challenge: AI service is temporarily unavailable. Please try again later.'));
      } else {
        // Hardcoded example challenges based on the OpenAPI specification's example structure
        const challenges = [
          `# Coding Challenge: Array Deduplication

**Problem Statement:**
Given an array of integers \`nums\`, remove the duplicates in-place such that each unique element appears only once.
The relative order of the elements should be kept the same.
Since it is impossible to change the length of the array in some languages, you must instead have the result be placed in the first part of the array \`nums\`.
More formally, if there are \`k\` elements after removing the duplicates, then the first \`k\` elements of \`nums\` should hold the final result.
It does not matter what you leave beyond the first \`k\` elements.

Return \`k\` after placing the final result in the first \`k\` slots of \`nums\`.

Do not allocate extra space for another array. You must do this by modifying the input array in-place with O(1) extra memory.

**Example 1:**
Input: \`nums = [1,1,2]\`
Output: \`2\`, \`nums\` should be \`[1,2,_]\` (underscores represent irrelevant values)

**Example 2:**
Input: \`nums = [0,0,1,1,1,2,2,3,3,4]\`
Output: \`5\`, \`nums\` should be \`[0,1,2,3,4,_,_,_,_,_]\`

**Constraints:**
* \`0 <= nums.length <= 3 * 10^4\`
* \`-100 <= nums[i] <= 100\`
* \`nums\` is sorted in non-decreasing order.`,

          `# Coding Challenge: Palindrome Checker

**Problem Statement:**
Given a string \`s\`, determine if it is a palindrome, considering only alphanumeric characters and ignoring cases.

**Example 1:**
Input: \`s = "A man, a plan, a canal: Panama"\`
Output: \`true\`
Explanation: \`"amanaplanacanalpanama"\` is a palindrome.

**Example 2:**
Input: \`s = "race a car"\`
Output: \`false\`
Explanation: \`"raceacar"\` is not a palindrome.

**Constraints:**
* \`1 <= s.length <= 2 * 10^5\`
* \`s\` consists only of printable ASCII characters.`,

          `# Coding Challenge: Find the Missing Number

**Problem Statement:**
Given an array \`nums\` containing \`n\` distinct numbers in the range \`[0, n]\`, return the only number in the range that is missing from the array.

**Example 1:**
Input: \`nums = [3,0,1]\`
Output: \`2\`
Explanation: \`n = 3\` since there are 3 numbers, so all numbers are in the range \`[0,3]\`. 2 is the missing number in the range since it does not appear in \`nums\`.

**Example 2:**
Input: \`nums = [0,1]\`
Output: \`2\`
Explanation: \`n = 2\` since there are 2 numbers, so all numbers are in the range \`[0,2]\`. 2 is the missing number in the range since it does not appear in \`nums\`.

**Constraints:**
* \`n == nums.length\`
* \`1 <= n <= 10^4\`
* \`0 <= nums[i] <= n\`
* All the numbers of \`nums\` are unique.`,
        ];

        const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
        resolve(randomChallenge);
      }
    }, Math.random() * 1500 + 500); // Simulate network latency between 0.5 to 2 seconds
  });
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
 * @component StyledAppContainer
 * @description The main container for the application, applies global styling and theme-dependent background/text colors.
 */
const StyledAppContainer = styled.div<ThemeProps>`
  font-family: 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: ${(props) => themeColors[props.theme].background};
  color: ${(props) => themeColors[props.theme].text};
  min-height: 100vh;
  padding: 20px;
  transition: all 0.3s ease-in-out; // Smooth transition for theme changes

  @media (max-width: 768px) {
    padding: 10px;
  }
`;

/**
 * @component StyledHeader
 * @description Application header component with branding and introductory text.
 */
const StyledHeader = styled.header<ThemeProps>`
  text-align: center;
  margin-bottom: 40px;
  padding: 20px;
  border-bottom: 1px solid ${(props) => themeColors[props.theme].border};

  h1 {
    color: ${(props) => themeColors[props.theme].primary};
    font-size: 2.5em;
    margin-bottom: 10px;
  }

  p {
    color: ${(props) => themeColors[props.theme].secondary};
    font-size: 1.1em;
  }

  @media (max-width: 768px) {
    h1 {
      font-size: 2em;
    }
    p {
      font-size: 1em;
    }
  }
`;

/**
 * @component StyledMain
 * @description Main content area, centered and with a maximum width for readability.
 */
const StyledMain = styled.main`
  max-width: 960px;
  margin: 0 auto;
  padding: 20px;

  @media (max-width: 768px) {
    padding: 0;
  }
`;

/**
 * @component StyledButton
 * @description A reusable button component with theme-dependent styling and hover effects.
 */
const StyledButton = styled.button<ThemeProps>`
  background-color: ${(props) => themeColors[props.theme].primary};
  color: #fff;
  border: none;
  padding: 12px 25px;
  border-radius: 8px;
  font-size: 1em;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out, transform 0.1s ease-in-out;
  display: block; // Make it a block element to center with margin auto
  margin: 20px auto; // Center the button

  &:hover {
    background-color: ${(props) => themeColors[props.theme].primary}e0; // Slightly darker on hover
    transform: translateY(-1px); // Subtle lift effect
  }

  &:active {
    transform: translateY(1px); // Subtle press effect
  }

  &:disabled {
    background-color: ${(props) => themeColors[props.theme].secondary};
    cursor: not-allowed;
    opacity: 0.7;
    transform: none; // No transform when disabled
  }
`;

/**
 * @component StyledCard
 * @description A general-purpose card component used to display challenge details.
 *              Features background, shadow, and border that adapt to the current theme.
 */
const StyledCard = styled.section<ThemeProps>`
  background-color: ${(props) => themeColors[props.theme].cardBackground};
  border-radius: 12px;
  box-shadow: 0 4px 12px ${(props) => themeColors[props.theme].shadow};
  padding: 30px;
  margin-bottom: 30px;
  border: 1px solid ${(props) => themeColors[props.theme].border};

  h2 {
    color: ${(props) => themeColors[props.theme].primary};
    margin-top: 0;
    margin-bottom: 20px;
    font-size: 1.8em;
  }

  p {
    line-height: 1.6;
    margin-bottom: 15px;
  }

  code {
    background-color: ${(props) => themeColors[props.theme].background};
    color: ${(props) => themeColors[props.theme].text};
    padding: 2px 4px;
    border-radius: 4px;
    font-family: 'Fira Code', 'Roboto Mono', monospace; // Enhanced monospace font stack
    font-size: 0.95em;
  }

  pre {
    background-color: ${(props) => themeColors[props.theme].background};
    color: ${(props) => themeColors[props.theme].text};
    padding: 15px;
    border-radius: 8px;
    overflow-x: auto;
    font-family: 'Fira Code', 'Roboto Mono', monospace;
    font-size: 0.9em;
    line-height: 1.5;
  }

  ul {
    padding-left: 25px;
  }

  li {
    margin-bottom: 8px;
  }

  @media (max-width: 768px) {
    padding: 20px;
    h2 {
      font-size: 1.5em;
    }
  }
`;

/**
 * @component StyledLoadingSpinner
 * @description A visual indicator for loading states, with an animated spinner.
 */
const StyledLoadingSpinner = styled.div<ThemeProps>`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 50px auto;
  min-height: 100px; // Ensure it takes up space even if content is empty

  div {
    width: 40px;
    height: 40px;
    border: 4px solid ${(props) => themeColors[props.theme].primary};
    border-top-color: transparent; // Creates the spinning effect
    border-radius: 50%;
    animation: spin 1s linear infinite; // Animation definition
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

/**
 * @component StyledErrorMessage
 * @description A styled component for displaying error messages clearly and distinctly.
 */
const StyledErrorMessage = styled.div<ThemeProps>`
  background-color: #f8d7da; // Light red background
  color: #721c24; // Dark red text
  border: 1px solid #f5c6cb;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
  font-weight: bold;
`;

/**
 * @component StyledToggleContainer
 * @description Container for theme toggle buttons, aligning them to the right.
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

// --- Component: DocumentHead (SEO) ---
/**
 * @component DocumentHead
 * @param {object} props
 * @param {string} props.title - The title for the document (displayed in browser tab).
 * @param {string} props.description - The meta description for SEO purposes.
 * @description A memoized component using `react-helmet-async` to dynamically manage the
 *              document's `<head>` elements, essential for SEO and browser tab display.
 */
export const DocumentHead: React.FC<{ title: string; description: string }> = React.memo(({ title, description }) => (
  <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
    {/* Open Graph / Social Media Meta Tags */}
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
    {/* <meta property="og:image" content="[URL to a representative image]" /> */}
    {/* Twitter Card Meta Tags */}
    {/* <meta name="twitter:card" content="summary_large_image" /> */}
    {/* <meta name="twitter:title" content={title} /> */}
    {/* <meta name="twitter:description" content={description} /> */}
    {/* <meta name="twitter:image" content="[URL to a representative image]" /> */}
  </Helmet>
));

// --- Component: ErrorBoundary ---
/**
 * @interface ErrorBoundaryProps
 * @description Props for the `ErrorBoundary` component, requiring children and a fallback UI.
 */
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

/**
 * @interface ErrorBoundaryState
 * @description State for the `ErrorBoundary` component, tracking if an error has occurred.
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null; // Stores the error object
  errorInfo: React.ErrorInfo | null; // Stores component stack information
}

/**
 * @class ErrorBoundary
 * @extends React.Component
 * @description An enterprise-grade error boundary component that catches JavaScript errors
 *              anywhere in its child component tree, logs them, and displays a predefined
 *              fallback UI instead of crashing the entire application. This prevents white screens.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  /**
   * @method getDerivedStateFromError
   * @param {Error} error - The error that was thrown.
   * @returns {ErrorBoundaryState} - Updated state to indicate an error has occurred.
   * @description A static method to update state when an error is thrown, causing the next render
   *              to display the fallback UI.
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null }; // errorInfo is handled in componentDidCatch
  }

  /**
   * @method componentDidCatch
   * @param {Error} error - The error that was caught.
   * @param {React.ErrorInfo} errorInfo - Object with `componentStack` key.
   * @description Catches JavaScript errors in child components. This method is used for
   *              side-effects like logging the error to a service (e.g., Sentry, Bugsnag).
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to an external error reporting service (e.g., Sentry, Datadog RUM)
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
    // You might send this to a service here:
    // logErrorToService(error, errorInfo);
    this.setState({ errorInfo }); // Store error info for potential display/debugging
  }

  render() {
    if (this.state.hasError) {
      // Render the custom fallback UI when an error is detected
      return this.props.fallback;
    }

    // Otherwise, render the children normally
    return this.props.children;
  }
}

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

// --- Component: ChallengeDisplay ---
/**
 * @interface ChallengeDisplayProps
 * @description Props for the `ChallengeDisplay` component.
 */
interface ChallengeDisplayProps {
  challenge: Challenge;
  theme: 'light' | 'dark';
}

/**
 * @component ChallengeDisplay
 * @param {ChallengeDisplayProps} props - The challenge data and current theme.
 * @description A memoized component responsible for rendering the detailed view of a coding challenge.
 *              It uses `react-markdown` to parse and display the challenge content, applying custom
 *              styling to markdown elements to match the application's theme.
 */
export const ChallengeDisplay: React.FC<ChallengeDisplayProps> = React.memo(({ challenge, theme }) => {
  if (!challenge) {
    return null; // Don't render if no challenge data
  }

  /**
   * @const components
   * @description Custom renderers for `react-markdown` to override default HTML elements
   *              and apply `styled-components` styling, ensuring theme consistency.
   */
  const components = {
    // Override h1 and h2 to match primary color and adjust font sizes
    h1: ({ node, ...props }: any) => <h2 {...props} style={{ color: themeColors[theme].primary, fontSize: '2em', marginBottom: '15px' }} />,
    h2: ({ node, ...props }: any) => <h3 {...props} style={{ color: themeColors[theme].primary, fontSize: '1.5em', marginBottom: '10px' }} />,
    // Ensure paragraphs have consistent line height
    p: ({ node, ...props }: any) => <p {...props} style={{ lineHeight: 1.6, marginBottom: '1em' }} />,
    // Strong text should respect theme text color
    strong: ({ node, ...props }: any) => <strong {...props} style={{ color: themeColors[theme].text }} />,
    // Custom styling for inline and block code snippets
    code: ({ node, inline, ...props }: any) => {
      const CodeComponent = inline ? 'code' : 'pre'; // Choose `code` for inline, `pre` for blocks
      return (
        <CodeComponent
          {...props}
          style={inline ? {
            // Inline code styling
            backgroundColor: themeColors[theme].background,
            color: themeColors[theme].text,
            padding: '2px 4px',
            borderRadius: '4px',
            fontFamily: 'Fira Code, Roboto Mono, monospace',
            fontSize: '0.95em',
          } : {
            // Block code (pre) styling
            backgroundColor: themeColors[theme].background,
            color: themeColors[theme].text,
            padding: '15px',
            borderRadius: '8px',
            overflowX: 'auto', // Allow horizontal scrolling for wide code blocks
            fontFamily: 'Fira Code, Roboto Mono, monospace',
            fontSize: '0.9em',
            lineHeight: 1.5,
          }}
        />
      );
    },
    // Further custom renderers could be added here for lists (ul, ol, li), tables (table, th, td), etc.
    // to apply more granular theme-dependent styling.
  };

  return (
    <StyledCard theme={theme} aria-live="polite" aria-atomic="true">
      {/* react-markdown component renders the challenge's full markdown content */}
      {/* remarkGfm adds support for GitHub Flavored Markdown features */}
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {challenge.fullMarkdown}
      </Markdown>
    </StyledCard>
  );
});

// --- Component: ChallengeGenerator ---
/**
 * @component ChallengeGenerator
 * @description This is the core component responsible for initiating the challenge generation
 *              process, displaying loading/error states, and rendering the `ChallengeDisplay`.
 *              It orchestrates the API call and state updates using `useAppContext`.
 */
export const ChallengeGenerator: React.FC = () => {
  const { state, dispatch } = useAppContext(); // Access global state and dispatch
  const { currentChallenge, isLoading, error, theme } = state;

  /**
   * @function generateChallenge
   * @description An asynchronous function to fetch a new coding challenge from the mock API.
   *              It dispatches actions to update the loading status, handle success with parsed data,
   *              or display an error message. Wrapped in `useCallback` for stability.
   */
  const generateChallenge = useCallback(async () => {
    dispatch({ type: ActionType.FETCH_START }); // Indicate that fetching has started
    try {
      const markdown = await mockFetchCodingChallenge(); // Simulate API call
      const parsedChallenge = parseMarkdownChallenge(markdown); // Parse the received markdown
      dispatch({ type: ActionType.FETCH_SUCCESS, payload: parsedChallenge }); // Update state with the new challenge
    } catch (err) {
      const errorMessage = (err instanceof Error) ? err.message : 'An unknown error occurred.';
      dispatch({ type: ActionType.FETCH_ERROR, payload: errorMessage }); // Dispatch error message
    }
  }, [dispatch]); // `dispatch` is guaranteed to be stable

  // Effect hook to fetch a challenge automatically on the initial render of the component
  useEffect(() => {
    generateChallenge();
  }, [generateChallenge]); // `generateChallenge` is stable due to `useCallback`

  return (
    <StyledMain>
      <StyledButton
        onClick={generateChallenge}
        disabled={isLoading} // Disable button while loading
        theme={theme}
        aria-busy={isLoading} // ARIA attribute for accessibility, indicates loading state
        aria-label={isLoading ? "Generating challenge..." : "Generate New AI Coding Challenge"}
      >
        {isLoading ? 'Generating Challenge...' : 'Generate New AI Coding Challenge'}
      </StyledButton>

      {/* Display error message if an error occurred */}
      {error && (
        <StyledErrorMessage theme={theme} role="alert">
          <strong>Error:</strong> {error} Please try again.
        </StyledErrorMessage>
      )}

      {/* Display loading spinner while challenge is being fetched */}
      {isLoading && (
        <StyledLoadingSpinner theme={theme} role="status" aria-label="Loading challenge">
          <div></div>
        </StyledLoadingSpinner>
      )}

      {/* Render the challenge display if a challenge is available and not loading/erroring */}
      {currentChallenge && !isLoading && !error && (
        <ChallengeDisplay challenge={currentChallenge} theme={theme} />
      )}
    </StyledMain>
  );
};

// --- Root Component: App ---
/**
 * @component App
 * @description The root component of the AI Coding Challenge Generator application.
 *              This component is responsible for setting up global providers (`HelmetProvider`, `AppProvider`)
 *              and wrapping the main application logic in an `ErrorBoundary` for resilience.
 *              It acts as the entry point for the entire React application.
 */
export const App: React.FC = () => {
  return (
    // HelmetProvider is needed for react-helmet-async to manage document head
    <HelmetProvider>
      {/* AppProvider makes global state and dispatch available to all children */}
      <AppProvider>
        {/* ErrorBoundary provides a fallback UI for unhandled JavaScript errors */}
        <ErrorBoundary fallback={
          <StyledErrorMessage theme='light' role="alert">
            <p><strong>Application Error:</strong> Something critical went wrong. Please refresh your browser.</p>
            <p>If the problem persists, contact support.</p>
          </StyledErrorMessage>
        }>
          {/* AppContent is a child component that actually consumes the context */}
          <AppContent />
        </ErrorBoundary>
      </AppProvider>
    </HelmetProvider>
  );
};

/**
 * @component AppContent
 * @description An internal component that consumes the `AppContext` and renders the main
 *              application layout, including the header, theme toggle, and `ChallengeGenerator`.
 *              Separated from `App` to allow `useAppContext` to be called within it.
 */
const AppContent: React.FC = () => {
  const { state } = useAppContext(); // Get global state
  const { theme } = state; // Extract current theme

  return (
    <StyledAppContainer theme={theme}>
      {/* DocumentHead sets the browser tab title and SEO metadata */}
      <DocumentHead
        title="AI Coding Challenge Generator"
        description="Generate unique AI coding challenges on demand. Perfect for practicing problem-solving skills and interviewing."
      />

      <StyledHeader theme={theme}>
        <h1>AI Coding Challenge Generator</h1>
        <p>Get a new, unique coding challenge generated by AI. Practice your skills!</p>
        <ThemeToggle /> {/* Theme switching UI */}
      </StyledHeader>

      <ChallengeGenerator /> {/* The main feature of the application */}
    </StyledAppContainer>
  );
};

// --- Optional: Routing Example (Uncomment and add react-router-dom if needed) ---
/*
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// To use routing, you would typically wrap your AppContent or main routes in a Router.
// For a single app.tsx file, this demonstrates how it would be structured.
export const AppWithRouting: React.FC = () => {
  return (
    <HelmetProvider>
      <AppProvider>
        <Router> // BrowserRouter should wrap the entire routing logic
          <ErrorBoundary fallback={<StyledErrorMessage theme='light' role="alert">
            <p>Oops! Something went wrong in the main application. Please try reloading the page.</p>
          </StyledErrorMessage>}>
            <AppLayoutWithRouting /> // A component to hold the layout and consume context
          </ErrorBoundary>
        </Router>
      </AppProvider>
    </HelmetProvider>
  );
};

// This component would consume context and render header/footer with routes in between
const AppLayoutWithRouting: React.FC = () => {
  const { state } = useAppContext();
  const { theme } = state;

  return (
    <StyledAppContainer theme={theme}>
      <DocumentHead
        title="AI Coding Challenge Generator"
        description="Generate unique AI coding challenges on demand. Perfect for practicing problem-solving skills."
      />
      <StyledHeader theme={theme}>
        <h1>AI Coding Challenge Generator</h1>
        <p>Get a new, unique coding challenge generated by AI. Practice your skills!</p>
        <ThemeToggle />
      </StyledHeader>
      <Routes>
        <Route path="/" element={<ChallengeGenerator />} />
        // Example of another route if you had multiple "pages"
        // <Route path="/about" element={<AboutPage />} />
        // <Route path="*" element={<NotFoundPage />} /> // Catch-all for 404
      </Routes>
    </StyledAppContainer>
  );
};
*/

// --- Optional: Lazy Loading Example (Uncomment if splitting files) ---
/*
// If ChallengeDisplay were a large, independent component, it could be lazy loaded:
// const LazyChallengeDisplay = lazy(() => import('./ChallengeDisplay'));

// Then, in ChallengeGenerator, you'd use Suspense:
// {isLoading && <StyledLoadingSpinner theme={theme}><div></div></StyledLoadingSpinner>}
// {!isLoading && !error && currentChallenge && (
//   <Suspense fallback={<StyledLoadingSpinner theme={theme}><div></div></StyledLoadingSpinner>}>
//     <LazyChallengeDisplay challenge={currentChallenge} theme={theme} />
//   </Suspense>
// )}
*/
```