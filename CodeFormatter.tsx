// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

// README:
// This is an enterprise-grade React application, `app.tsx`, demonstrating best practices
// for a production-ready, maintainable, and scalable single-page application.
//
// It combines a code formatting utility with AI-powered capabilities (simulated).
//
// Key Features:
// - **Single File Structure**: All components, services, and utilities are
//   consolidated into `app.tsx` for easy deployment and understanding in this demo.
// - **TypeScript**: Strict typing for props, state, and functions for enhanced reliability.
// - **State Management**: Uses React's `useState` and `useReducer` for local component state.
//   A `CodeFormattingProvider` (using Context API) is included to demonstrate a pattern
//   for larger applications, though the primary `App` component uses direct state for simplicity.
// - **Error Handling**: Implements a robust `ErrorBoundary` component to catch and display
//   UI errors gracefully.
// - **Loading & Error States**: Explicitly handles asynchronous operation states for
//   improved user experience.
// - **Responsive Design**: Utilizes Tailwind CSS for a modern and responsive user interface.
// - **Accessibility (A11y)**: Incorporates ARIA attributes and semantic HTML for
//   better usability for all users.
// - **Performance Optimization**: Employs `useCallback` for stable event handlers
//   and `React.memo` for potential child component optimization (though not strictly needed
//   as components are merged, the pattern is shown).
// - **SEO**: Includes a basic `Helmet` (simulated) for managing document metadata.
// - **Clear Documentation**: Extensive comments describe components, functions, and types.
//
// Dependencies (assumed to be installed in a standard React project):
// - react
// - react-dom
// - marked (for Markdown parsing)
// - react-helmet-async (or a similar library for SEO, simulated here)
// - tailwindcss (via PostCSS setup)
//
// To run this file:
// 1. Ensure you have a React project setup with TypeScript.
// 2. Install `marked` (npm install marked)
// 3. Replace your `src/App.tsx` (or similar entry point) with the content of this file.
// 4. Ensure Tailwind CSS is configured in your project.
//

import React, {
  useState,
  useCallback,
  useReducer,
  createContext,
  useContext,
  ReactNode,
  memo,
  ErrorInfo,
} from 'react';
import { marked } from 'marked'; // Assuming 'marked' is installed as a standard dependency

// =============================================================================
// GLOBAL TYPE DEFINITIONS & INTERFACES
// =============================================================================

/**
 * @typedef {Object} CodeFormatterState
 * @property {string} inputCode - The unformatted code entered by the user.
 * @property {string} formattedCode - The AI-formatted code output.
 * @property {boolean} isLoading - Indicates if the formatting process is active.
 * @property {string} error - Any error message encountered during formatting.
 */
interface CodeFormatterState {
  inputCode: string;
  formattedCode: string;
  isLoading: boolean;
  error: string;
}

/**
 * @typedef {Object} CodeFormatterAction
 * @property {'SET_INPUT_CODE' | 'SET_FORMATTED_CODE' | 'SET_LOADING' | 'SET_ERROR' | 'RESET'} type - The type of action to perform.
 * @property {any} [payload] - The data associated with the action.
 */
type CodeFormatterAction =
  | { type: 'SET_INPUT_CODE'; payload: string }
  | { type: 'SET_FORMATTED_CODE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'RESET' };

/**
 * @typedef {Object} SEOProps
 * @property {string} title - The title for the document.
 * @property {string} description - The meta description for the document.
 * @property {string} [keywords] - Optional meta keywords.
 * @property {string} [ogImage] - Open Graph image URL.
 */
interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
}

/**
 * @typedef {Object} ErrorBoundaryProps
 * @property {ReactNode} children - The child components to be rendered within the boundary.
 * @property {ReactNode} [fallback] - An optional fallback UI to render when an error occurs.
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * @typedef {Object} ErrorBoundaryState
 * @property {boolean} hasError - True if an error has occurred in a child component.
 */
interface ErrorBoundaryState {
  hasError: boolean;
}

// =============================================================================
// MOCKED SERVICES (originally from '../../services/geminiService.ts')
// For a real application, these would be actual API calls.
// =============================================================================

/**
 * Simulates an AI service call to format code.
 * Introduces a delay and potential error for demonstration purposes.
 * @param {string} code - The unformatted code string.
 * @returns {Promise<string>} A promise that resolves with the formatted code.
 * @throws {Error} If the simulated API call fails (e.g., due to specific input).
 */
export const formatCode = async (code: string): Promise<string> => {
  console.log('Simulating AI code formatting for:', code.substring(0, Math.min(code.length, 50)) + (code.length > 50 ? '...' : ''));
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (code.includes('throw new Error') || code.length > 5000) { // Simulate large input or specific error trigger
        reject(new Error('AI formatting service is temporarily unavailable or input too large. Please try again.'));
      } else if (code.includes('corrupt') || code.includes('bad code')) {
        resolve(`// AI detected potential issues. Here's a best-effort format:\n${code.trim()}\n// Please review this section carefully.`);
      } else {
        const formatted = `\`\`\`typescript\n// Formatted by AI\n${code.trim().split('\n').map(line => '  ' + line.trim()).join('\n')}\n\`\`\``;
        resolve(formatted);
      }
    }, Math.random() * 1500 + 500); // Simulate network latency between 0.5 and 2 seconds
  });
};


// =============================================================================
// SHARED UI COMPONENTS (originally from './shared/LoadingSpinner.tsx' and '../icons/FeatureIcons.tsx')
// These are simple components redefined for self-containment.
// =============================================================================

/**
 * A simple loading spinner component.
 * @component
 * @returns {JSX.Element} The loading spinner UI.
 */
export const LoadingSpinner: React.FC = () => (
  <svg className="animate-spin h-5 w-5 text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

/**
 * An SVG icon representing code brackets.
 * @component
 * @returns {JSX.Element} The code brackets icon UI.
 */
export const CodeBracketSquareIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-cyan-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
  </svg>
);

// =============================================================================
// CONTEXT API FOR GLOBAL STATE (Demonstration of scalable state management)
// This is an example for how to structure shared state. For this specific app,
// the App component's local state is sufficient, but this pattern is common
// in enterprise applications.
// =============================================================================

/**
 * The initial state for the code formatter context.
 */
const initialCodeFormatterState: CodeFormatterState = {
  inputCode: `const MyComponent = (props: { name: string; items: { id: number; name: string }[] }) => {
    const { name, items } = props;
    if (!items || items.length === 0) {
      return <p>No items found for {name}</p>;
    }
    return (
      <ul>
        {items.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    );
  };`,
  formattedCode: '',
  isLoading: false,
  error: '',
};

/**
 * Reducer function for managing `CodeFormatterState`.
 * @param {CodeFormatterState} state - The current state.
 * @param {CodeFormatterAction} action - The action to be dispatched.
 * @returns {CodeFormatterState} The new state.
 */
const codeFormatterReducer = (state: CodeFormatterState, action: CodeFormatterAction): CodeFormatterState => {
  switch (action.type) {
    case 'SET_INPUT_CODE':
      return { ...state, inputCode: action.payload, error: '' };
    case 'SET_FORMATTED_CODE':
      return { ...state, formattedCode: action.payload, isLoading: false, error: '' };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false, formattedCode: '' };
    case 'RESET':
      return initialCodeFormatterState;
    default:
      return state;
  }
};

/**
 * Defines the shape of the context value.
 * @typedef {Object} CodeFormattingContextType
 * @property {CodeFormatterState} state - The current state of the code formatter.
 * @property {(code: string) => Promise<void>} formatCodeAsync - Function to trigger code formatting.
 * @property {(code: string) => void} setInputCode - Function to update the input code.
 * @property {() => void} resetState - Function to reset the formatter state.
 */
interface CodeFormattingContextType {
  state: CodeFormatterState;
  formatCodeAsync: (code: string) => Promise<void>;
  setInputCode: (code: string) => void;
  resetState: () => void;
}

const CodeFormattingContext = createContext<CodeFormattingContextType | undefined>(undefined);

/**
 * Provides the code formatting state and actions to its children.
 * @component
 * @param {Object} props - The component props.
 * @param {ReactNode} props.children - The child components.
 * @returns {JSX.Element} The context provider.
 */
export const CodeFormattingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(codeFormatterReducer, initialCodeFormatterState);

  const setInputCode = useCallback((code: string) => {
    dispatch({ type: 'SET_INPUT_CODE', payload: code });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const formatCodeAsync = useCallback(async (codeToFormat: string) => {
    if (!codeToFormat.trim()) {
      dispatch({ type: 'SET_ERROR', payload: 'Please enter some code to format.' });
      return;
    }
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: '' });
    dispatch({ type: 'SET_FORMATTED_CODE', payload: '' });
    try {
      const result = await formatCode(codeToFormat); // Using the mocked service
      dispatch({ type: 'SET_FORMATTED_CODE', payload: result });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      dispatch({ type: 'SET_ERROR', payload: `Failed to format code: ${errorMessage}` });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const contextValue = React.useMemo(() => ({
    state,
    formatCodeAsync,
    setInputCode,
    resetState,
  }), [state, formatCodeAsync, setInputCode, resetState]);

  return (
    <CodeFormattingContext.Provider value={contextValue}>
      {children}
    </CodeFormattingContext.Provider>
  );
};

/**
 * Custom hook to consume the CodeFormattingContext.
 * @returns {CodeFormattingContextType} The context value (state and actions).
 * @throws {Error} If used outside of a `CodeFormattingProvider`.
 */
export const useCodeFormatter = (): CodeFormattingContextType => {
  const context = useContext(CodeFormattingContext);
  if (context === undefined) {
    throw new Error('useCodeFormatter must be used within a CodeFormattingProvider');
  }
  return context;
};

// =============================================================================
// ERROR BOUNDARY COMPONENT
// A robust way to catch JavaScript errors anywhere in their child component tree,
// log those errors, and display a fallback UI.
// =============================================================================

/**
 * A React Error Boundary component to catch JavaScript errors in its child component tree.
 * @component
 * @extends React.Component<ErrorBoundaryProps, ErrorBoundaryState>
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };

  /**
   * Updates state so the next render will show the fallback UI.
   * @param {Error} error - The error that was thrown.
   * @returns {ErrorBoundaryState} The updated state.
   */
  public static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  /**
   * Catches uncaught JavaScript errors in components below and logs them.
   * @param {Error} error - The error that was thrown.
   * @param {ErrorInfo} errorInfo - An object with a `componentStack` key.
   */
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // In a real application, you might send this error to an error reporting service
    // e.g., Sentry.captureException(error, { extra: errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-8 bg-red-900/50 border border-red-700 rounded-md text-red-100 flex flex-col items-center justify-center">
          <h2 className="text-xl font-bold mb-2">Something went wrong.</h2>
          <p className="text-red-300 mb-4">We're sorry for the inconvenience. Please try refreshing the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white font-medium transition-colors"
            aria-label="Refresh page"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// =============================================================================
// SEO COMPONENT (Simulated React Helmet/Head)
// For managing document head properties like title and meta tags.
// =============================================================================

/**
 * A simulated `Helmet` component for managing document SEO metadata.
 * In a real application, you would use `react-helmet-async` or Next.js `Head`.
 * @component
 * @param {SEOProps} props - The SEO properties.
 * @returns {JSX.Element | null} Null, as it directly modifies the document head.
 */
export const SEO: React.FC<SEOProps> = ({ title, description, keywords, ogImage }) => {
  React.useEffect(() => {
    document.title = title;
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', description);

    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (keywords) {
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', keywords);
    } else if (metaKeywords) {
      // If keywords are removed, remove the meta tag as well
      document.head.removeChild(metaKeywords);
    }

    // Open Graph for social media sharing
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) { ogTitle = document.createElement('meta'); ogTitle.setAttribute('property', 'og:title'); document.head.appendChild(ogTitle); }
    ogTitle.setAttribute('content', title);

    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) { ogDescription = document.createElement('meta'); ogDescription.setAttribute('property', 'og:description'); document.head.appendChild(ogDescription); }
    ogDescription.setAttribute('content', description);

    if (ogImage) {
      let ogImg = document.querySelector('meta[property="og:image"]');
      if (!ogImg) { ogImg = document.createElement('meta'); ogImg.setAttribute('property', 'og:image'); document.head.appendChild(ogImg); }
      ogImg.setAttribute('content', ogImage);
    }

  }, [title, description, keywords, ogImage]);

  return null;
};


// =============================================================================
// MAIN APPLICATION COMPONENT
// This is the root component that ties everything together.
// (Originally `CodeFormatter`, now expanded into `App`)
// =============================================================================

/**
 * The main application component, acting as the root of the React app.
 * It provides the core AI Code Formatter functionality, integrating
 * UI, state management, error handling, and accessibility.
 * @component
 * @returns {JSX.Element} The root application UI.
 */
export const App: React.FC = () => {
  // Using local state for the main App component for simplicity,
  // but CodeFormattingProvider demonstrates a scalable pattern.
  const [inputCode, setInputCodeState] = useState<string>(initialCodeFormatterState.inputCode);
  const [formattedCode, setFormattedCodeState] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  /**
   * Handles the code formatting process.
   * This function is memoized using `useCallback` to prevent unnecessary re-renders.
   * @async
   * @returns {Promise<void>}
   */
  const handleFormat = useCallback(async () => {
    if (!inputCode.trim()) {
      setError('Please enter some code to format.');
      setFormattedCodeState(''); // Clear previous formatted code on new error
      return;
    }
    setIsLoading(true);
    setError('');
    setFormattedCodeState(''); // Clear previous formatted code
    try {
      const result = await formatCode(inputCode); // Use the mocked service
      setFormattedCodeState(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to format code: ${errorMessage}`);
      setFormattedCodeState(''); // Ensure formatted code is cleared on error
    } finally {
      setIsLoading(false);
    }
  }, [inputCode]); // Dependency array ensures handleFormat updates only when inputCode changes

  // Using React.memo for a display component, demonstrating the pattern.
  // In this single-file setup, it's less critical, but good for larger apps.
  const FormattedCodeDisplay = memo<{ code: string }>(({ code }) => {
    if (!code) return null;
    return (
      <div
        className="prose prose-sm prose-invert max-w-none prose-pre:bg-transparent prose-pre:p-4 prose-pre:m-0 prose-code:text-cyan-300"
        dangerouslySetInnerHTML={{ __html: marked(code) }}
        aria-live="polite" // Announce changes to screen readers
        aria-atomic="true"
      />
    );
  });

  return (
    <ErrorBoundary> {/* Wrap the entire app with an Error Boundary */}
      <SEO
        title="AI Code Formatter | Enterprise React App"
        description="Clean up your code with an AI-powered formatter, built with best practices for enterprise applications."
        keywords="AI, code formatter, React, TypeScript, enterprise, production-ready, best practices"
        ogImage="https://example.com/og-image.jpg" // Replace with actual image URL
      />
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 sm:p-6 lg:p-8">
        <header className="mb-6 text-center lg:text-left">
          <h1 className="text-4xl font-extrabold text-cyan-400 flex items-center justify-center lg:justify-start">
            <CodeBracketSquareIcon />
            <span className="ml-3">AI Code Formatter</span>
          </h1>
          <p className="text-slate-400 mt-2 text-lg" role="doc-subtitle">
            Clean up your code with AI-powered formatting, like a smart Prettier.
          </p>
        </header>

        <section className="flex-grow flex flex-col min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow min-h-0">
            {/* Input Section */}
            <div className="flex flex-col h-full bg-slate-900 rounded-lg shadow-lg p-4">
              <label htmlFor="code-input" className="text-sm font-medium text-slate-400 mb-2 sr-only">Input Code</label>
              <h2 className="text-xl font-semibold text-slate-200 mb-3">Your Code Input</h2>
              <textarea
                id="code-input"
                value={inputCode}
                onChange={(e) => setInputCodeState(e.target.value)}
                placeholder="Paste your unformatted code here... (e.g., JavaScript, TypeScript, JSX)"
                className="flex-grow p-4 bg-slate-800 border border-slate-700 rounded-md resize-none font-mono text-sm text-cyan-300 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-colors"
                aria-label="Code input area"
                aria-describedby="input-code-description"
              />
              <p id="input-code-description" className="sr-only">
                Paste your unformatted code into this textarea. The AI will then format it.
              </p>
            </div>

            {/* Output Section */}
            <div className="flex flex-col h-full bg-slate-900 rounded-lg shadow-lg p-4">
              <h2 className="text-xl font-semibold text-slate-200 mb-3">Formatted Output</h2>
              <div
                className="flex-grow p-1 bg-slate-800/50 border border-slate-700/50 rounded-md overflow-y-auto relative"
                aria-live="polite" // Announce dynamic content changes
                aria-atomic="true"
              >
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-800/70 z-10" role="status" aria-label="Formatting in progress">
                    <LoadingSpinner />
                    <span className="ml-2 text-slate-400">Formatting code...</span>
                  </div>
                )}
                {error && (
                  <div className="p-4 text-red-400 bg-red-900/20 border border-red-700 rounded-md m-2" role="alert">
                    <p className="font-bold mb-1">Error:</p>
                    <p>{error}</p>
                  </div>
                )}
                {formattedCode ? (
                  <FormattedCodeDisplay code={formattedCode} />
                ) : (
                  !isLoading && !error && (
                    <div className="text-slate-500 h-full flex items-center justify-center p-4">
                      Formatted code will appear here after you click 'Format Code'.
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleFormat}
              disabled={isLoading}
              className="w-full max-w-md flex items-center justify-center px-8 py-3 bg-cyan-600 text-slate-900 font-bold rounded-md hover:bg-cyan-500 transition-colors disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed shadow-xl text-lg"
              aria-live="polite"
              aria-label={isLoading ? "Formatting code" : "Format Code"}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner />
                  <span className="ml-2">Formatting...</span>
                </>
              ) : (
                'Format Code'
              )}
            </button>
          </div>
        </section>

        <footer className="mt-8 pt-6 border-t border-slate-800 text-slate-500 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} AI Code Formatter Demo. All rights reserved.</p>
          <p>Powered by simulated AI technology.</p>
        </footer>
      </main>
    </ErrorBoundary>
  );
};

// Optional: If you want to use the Context API for the main App,
// you would wrap the App with the provider in your entry file (e.g., index.tsx).
// Example:
// ReactDOM.createRoot(document.getElementById('root')!).render(
//   <React.StrictMode>
//     <CodeFormattingProvider>
//       <App />
//     </CodeFormattingProvider>
//   </React.StrictMode>,
// );
