// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

/**
 * @file app.tsx
 * @description This file consolidates the Code Review Bot functionality into a single, enterprise-grade React application.
 * It demonstrates best practices including component combination, robust state management using Context API,
 * error handling with an Error Boundary, accessibility features, SEO metadata, and performance optimizations.
 *
 * The application allows users to input code, send it to a Gemini-powered AI service for review,
 * and display the formatted feedback. It includes loading and error states for a smooth user experience.
 */

import React, { useState, useCallback, createContext, useContext, useReducer, useEffect, PropsWithChildren } from 'react';
import { reviewCode } from '../../services/geminiService.ts'; // Keep original external service import
import { marked } from 'marked';
import { Helmet } from 'react-helmet-async'; // Assuming react-helmet-async is available for SEO

// --- Utility Components & Hooks ---

/**
 * @component ErrorBoundary
 * @description Catches JavaScript errors anywhere in its child component tree, logs those errors,
 * and displays a fallback UI instead of the component tree that crashed.
 * This ensures that a single component crash doesn't bring down the entire application.
 */
interface ErrorBoundaryProps extends PropsWithChildren {}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // You can also log the error to an error reporting service
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        // Optionally, send error to a logging service like Sentry, New Relic, etc.
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="p-8 bg-red-900 text-white rounded-lg shadow-xl text-center flex flex-col items-center justify-center h-full">
                    <h2 className="text-2xl font-bold mb-4">Oops! Something went wrong.</h2>
                    <p className="text-lg mb-6">We're sorry for the inconvenience. Please try refreshing the page or contact support.</p>
                    {this.state.error && (
                        <details className="text-sm bg-red-800 p-4 rounded-md overflow-auto max-h-48 w-full max-w-lg text-left">
                            <summary className="cursor-pointer font-semibold">Error Details</summary>
                            <pre className="mt-2 whitespace-pre-wrap break-words">{this.state.error.message}</pre>
                            {/* For security/production, consider if you want to show the full stack trace */}
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

// --- Component: LoadingSpinner ---
/**
 * @component LoadingSpinner
 * @description A simple, animated SVG spinner for indicating loading states.
 */
export const LoadingSpinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

// --- Component: CpuChipIcon ---
/**
 * @component CpuChipIcon
 * @description An SVG icon representing a CPU chip, typically used for AI or processing-related features.
 * This is a generic icon from the original codebase.
 */
export const CpuChipIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
        <path d="M7 17a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm8.94-7.56a2 2 0 0 0-2.82-2.82L17 8.17l-.17-.17-1.42 1.42.17.17 1.41 1.41 1.41 1.41.17.17a2 2 0 0 0 2.82-2.82ZM15.83 17l1.41-1.41 1.42 1.41-1.41 1.42L15.83 17Zm0-12.83-1.41 1.41-1.42-1.41 1.41-1.42 1.42 1.42ZM8.17 17l1.41-1.41-1.41-1.42-1.42 1.41 1.42 1.42Zm0-12.83-1.41 1.41-1.42-1.41 1.41-1.42 1.42 1.42ZM22 13h-2v2h2v-2Zm0-4h-2V7h2v2ZM4 13H2v2h2v-2ZM4 9H2V7h2v2ZM13 2h2v2h-2V2ZM9 2h2v2H9V2ZM13 22h2v-2h-2v2ZM9 22h2v-2H9v2Z" />
        <path d="M11 12a1 1 0 1 0-2 0 1 1 0 0 0 2 0Zm0 4a1 1 0 1 0-2 0 1 1 0 0 0 2 0Zm-4-4a1 1 0 1 0-2 0 1 1 0 0 0 2 0Zm0 4a1 1 0 1 0-2 0 1 1 0 0 0 2 0Zm10 0a1 1 0 1 0-2 0 1 1 0 0 0 2 0Zm0-4a1 1 0 1 0-2 0 1 1 0 0 0 2 0Zm-4-4a1 1 0 1 0-2 0 1 1 0 0 0 2 0Zm0-4a1 1 0 1 0-2 0 1 1 0 0 0 2 0Z" />
    </svg>
);

// --- Code Review Context API ---

/**
 * @typedef CodeReviewState
 * @property {string} code - The code snippet to be reviewed.
 * @property {string} review - The AI-generated code review feedback.
 * @property {boolean} isLoading - Indicates if a review request is in progress.
 * @property {string} error - Any error message encountered during the review process.
 */
interface CodeReviewState {
    code: string;
    review: string;
    isLoading: boolean;
    error: string;
}

/**
 * @typedef CodeReviewContextType
 * @property {CodeReviewState} state - The current state of the code review bot.
 * @property {(newCode: string) => void} setCode - Function to update the code input.
 * @property {() => Promise<void>} generateReview - Function to trigger the AI review process.
 * @property {(newError: string) => void} setError - Function to manually set error messages.
 */
interface CodeReviewContextType {
    state: CodeReviewState;
    setCode: (newCode: string) => void;
    generateReview: () => Promise<void>;
    setError: (newError: string) => void;
}

const CodeReviewContext = createContext<CodeReviewContextType | undefined>(undefined);

// Define actions for the reducer
type CodeReviewAction =
    | { type: 'SET_CODE'; payload: string }
    | { type: 'SET_REVIEW'; payload: string }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string }
    | { type: 'START_GENERATION' }
    | { type: 'RESET_STATE' };

/**
 * @function codeReviewReducer
 * @description A reducer function to manage the state of the code review bot.
 * This centralizes state logic and makes it more predictable.
 */
const codeReviewReducer = (state: CodeReviewState, action: CodeReviewAction): CodeReviewState => {
    switch (action.type) {
        case 'SET_CODE':
            return { ...state, code: action.payload };
        case 'SET_REVIEW':
            return { ...state, review: action.payload };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'START_GENERATION':
            return { ...state, isLoading: true, error: '', review: '' };
        case 'RESET_STATE':
            return { ...state, review: '', isLoading: false, error: '' };
        default:
            return state;
    }
};

/**
 * @component CodeReviewProvider
 * @description Provides the code review state and actions to its children components via Context API.
 * This encapsulates the core logic and state management for the application.
 */
export const CodeReviewProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const exampleCode = `function UserList(users) {
  if (users.length = 0) {
    return "no users";
  } else {
    return (
      users.map(u => {
        return <li>{u.name}</li>
      })
    )
  }
}`; // Original example code

    const initialState: CodeReviewState = {
        code: exampleCode,
        review: '',
        isLoading: false,
        error: '',
    };

    const [state, dispatch] = useReducer(codeReviewReducer, initialState);

    const setCode = useCallback((newCode: string) => {
        dispatch({ type: 'SET_CODE', payload: newCode });
    }, []);

    const setError = useCallback((newError: string) => {
        dispatch({ type: 'SET_ERROR', payload: newError });
    }, []);

    const generateReview = useCallback(async () => {
        if (!state.code.trim()) {
            dispatch({ type: 'SET_ERROR', payload: 'Please enter some code to review.' });
            return;
        }

        dispatch({ type: 'START_GENERATION' });

        try {
            const result = await reviewCode(state.code);
            dispatch({ type: 'SET_REVIEW', payload: result });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            dispatch({ type: 'SET_ERROR', payload: `Failed to get review: ${errorMessage}` });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [state.code]);

    const contextValue: CodeReviewContextType = {
        state,
        setCode,
        generateReview,
        setError,
    };

    return (
        <CodeReviewContext.Provider value={contextValue}>
            {children}
        </CodeReviewContext.Provider>
    );
};

/**
 * @hook useCodeReview
 * @description A custom hook to conveniently access the Code Review Context.
 * Throws an error if used outside of `CodeReviewProvider`.
 */
export const useCodeReview = () => {
    const context = useContext(CodeReviewContext);
    if (context === undefined) {
        throw new Error('useCodeReview must be used within a CodeReviewProvider');
    }
    return context;
};

// --- Component: AppHeader ---
/**
 * @component AppHeader
 * @description Displays the main title and description for the Code Review Bot.
 * Uses `React.memo` for performance optimization, preventing unnecessary re-renders.
 */
export const AppHeader: React.FC = React.memo(() => (
    <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-100 flex items-center">
            <CpuChipIcon aria-hidden="true" className="mr-3 text-cyan-400" /> {/* Added aria-hidden and improved spacing */}
            <span>AI Code Review Bot</span>
        </h1>
        <p className="text-slate-400 mt-1" id="app-description">Get an automated code review from Gemini.</p>
    </header>
));

// --- Component: CodeInputSection ---
/**
 * @component CodeInputSection
 * @description Handles the user input for code and triggers the review generation.
 * Consumes state and actions from `CodeReviewContext`.
 */
export const CodeInputSection: React.FC = React.memo(() => {
    const { state, setCode, generateReview } = useCodeReview();
    const { code, isLoading } = state;

    // Memoize the onChange handler to avoid unnecessary re-renders of textarea
    const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCode(e.target.value);
    }, [setCode]);

    return (
        <section className="flex flex-col h-full bg-slate-900 rounded-lg shadow-xl p-4 lg:p-6" aria-labelledby="code-input-label">
            <label htmlFor="code-input" id="code-input-label" className="text-sm font-medium text-slate-400 mb-2">Code to Review</label>
            <textarea
                id="code-input"
                value={code}
                onChange={handleCodeChange}
                placeholder="Paste your code here..."
                className="flex-grow p-4 bg-slate-900 border border-slate-700 rounded-md resize-none font-mono text-sm text-cyan-300 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                aria-describedby="app-description"
                aria-multiline="true"
            />
            <button
                onClick={generateReview}
                disabled={isLoading}
                className="mt-4 w-full flex items-center justify-center px-6 py-3 bg-cyan-500 text-slate-900 font-bold rounded-md hover:bg-cyan-400 disabled:bg-slate-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-200"
                aria-live="polite" // Announce button state changes for screen readers
                aria-busy={isLoading}
            >
                {isLoading ? (
                    <>
                        <LoadingSpinner />
                        <span className="ml-2">Requesting Review...</span>
                    </>
                ) : 'Request Review'}
            </button>
        </section>
    );
});

// --- Component: AIReviewOutputSection ---
/**
 * @component AIReviewOutputSection
 * @description Displays the AI-generated code review, loading states, and error messages.
 * Uses `dangerouslySetInnerHTML` for rendering Markdown, assuming sanitized input from `marked`.
 * Consumes state from `CodeReviewContext`.
 */
export const AIReviewOutputSection: React.FC = React.memo(() => {
    const { state } = useCodeReview();
    const { review, isLoading, error } = state;

    // Use a ref for the output div to manage scroll-to-top on new content
    const reviewOutputRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (review && reviewOutputRef.current) {
            reviewOutputRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [review]);

    // Memoize the rendered markdown to avoid re-calculating on every render
    const renderedReview = React.useMemo(() => {
        if (review) {
            return marked.parse(review);
        }
        return '';
    }, [review]);

    return (
        <section className="flex flex-col h-full bg-slate-800/50 rounded-lg shadow-xl p-4 lg:p-6" aria-labelledby="ai-feedback-label">
            <label id="ai-feedback-label" className="text-sm font-medium text-slate-400 mb-2">AI Feedback</label>
            <div
                ref={reviewOutputRef}
                className="flex-grow p-4 bg-slate-800/50 border border-slate-700/50 rounded-md overflow-y-auto text-slate-200 relative focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200"
                tabIndex={0} // Make div focusable for better accessibility
                role="region" // Announce as a region for screen readers
                aria-live="polite" // Announce changes to content politely
                aria-atomic="false" // Screen reader should announce entire region, but changes are atomic.
            >
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-800/75 z-10 text-cyan-400">
                        <LoadingSpinner />
                        <span className="ml-2 text-lg">Analyzing code...</span>
                    </div>
                )}
                {error && <p className="text-red-400 p-2 border border-red-600 bg-red-900/20 rounded-md">{error}</p>}
                {renderedReview && !isLoading && (
                    <div
                        className="prose prose-sm prose-invert max-w-none break-words"
                        dangerouslySetInnerHTML={{ __html: renderedReview }}
                    />
                )}
                {!isLoading && !review && !error && (
                    <div className="text-slate-500 h-full flex items-center justify-center text-center">
                        Your AI-powered code review will appear here.
                        <br />
                        Try entering some code above and clicking "Request Review".
                    </div>
                )}
            </div>
        </section>
    );
});

// --- Main App Component ---
/**
 * @component App
 * @description The root component of the application. It wraps the entire application
 * with the `CodeReviewProvider` and `ErrorBoundary` for robust state management and error handling.
 * It also includes SEO metadata via `Helmet`.
 */
export const App: React.FC = () => {
    return (
        <HelmetProvider> {/* Assuming HelmetProvider from react-helmet-async wraps the root of your actual app */}
            <Helmet>
                <title>AI Code Review Bot - Gemini Powered</title>
                <meta name="description" content="Get instant, intelligent code reviews using Gemini AI for better code quality and faster development." />
                <meta name="keywords" content="AI code review, Gemini, code analysis, programming, development tools, React, TypeScript" />
                <meta name="author" content="James Burvel O’Callaghan III" />
                <meta property="og:title" content="AI Code Review Bot" />
                <meta property="og:description" content="Instant code reviews powered by Gemini AI." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={window.location.href} />
                {/* <meta property="og:image" content="/path/to/og-image.jpg" /> */} {/* Add an appropriate OG image */}
            </Helmet>
            <ErrorBoundary>
                <CodeReviewProvider>
                    <div className="h-full min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 sm:p-6 lg:p-8 font-sans">
                        <AppHeader />
                        <main className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-hidden" role="main">
                            <CodeInputSection />
                            <AIReviewOutputSection />
                        </main>
                        {/* Optional: Add a footer for enterprise applications */}
                        <footer className="mt-8 text-center text-slate-500 text-sm">
                            <p>&copy; {new Date().getFullYear()} Citibank Demo Business Inc. All rights reserved.</p>
                            <p>Powered by Gemini AI.</p>
                        </footer>
                    </div>
                </CodeReviewProvider>
            </ErrorBoundary>
        </HelmetProvider>
    );
};
