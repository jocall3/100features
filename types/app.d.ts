/**
 * @file types/app.d.ts
 * @description Declares global TypeScript interfaces and types for the application's state, actions, and data structures
 *              like Challenge and ChallengeExample. These types are essential for strong typing throughout the React application.
 *              This file follows the style and structure established in AiCodingChallenge.tsx.
 * @author James Burvel O’Callaghan III
 * @license Copyright James Burvel O’Callaghan III, President Citibank Demo Business Inc.
 */

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

/**
 * @interface AppContextType
 * @description Type definition for the value provided by the `AppContext`.
 */
export interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}