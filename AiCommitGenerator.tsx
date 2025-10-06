```tsx
// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

/**
 * @file AiCommitGenerator.tsx
 * @description
 * This file implements an enterprise-grade AI Commit Message Generator.
 * It provides a user interface to input a Git diff and uses an AI service
 * (Gemini) to generate a concise and relevant commit message.
 *
 * Key features and enterprise considerations include:
 * - **Robust State Management:** Utilizes React's Context API to manage the
 *   generator's dynamic state (diff, message, loading, error) and a separate
 *   context for persistent commit history, demonstrating scalable state management patterns.
 * - **Error Handling:** Implements an `ErrorBoundary` component for gracefully
 *   handling unexpected UI errors, preventing crashes and enhancing application stability.
 * - **Accessibility (a11y):** Incorporates ARIA attributes, semantic HTML, and
 *   screen-reader-only text to ensure the application is usable by individuals
 *   with disabilities, adhering to WCAG guidelines.
 * - **Performance Optimization:** Employs `React.memo` for component memoization
 *   and `useCallback`/`useMemo` for function and value memoization, preventing
 *   unnecessary re-renders and optimizing overall performance.
 * - **Responsive Design:** Utilizes Tailwind CSS for a mobile-first, responsive
 *   user experience that adapts seamlessly across various screen sizes.
 * - **Persistence:** Stores commit history and the last used diff input in
 *   `localStorage` for user convenience and data persistence across sessions.
 * - **Clear UI Feedback:** Provides distinct loading, error, and success states
 *   with appropriate visual cues and accessibility announcements, guiding the user.
 * - **Type Safety:** Heavily leverages TypeScript for compile-time error checking,
 *   improving code maintainability, reliability, and developer experience.
 * - **Modularity:** Internal components and contexts are clearly separated
 *   by comments and export patterns, promoting a modular and maintainable codebase.
 *
 * This component is designed to be self-contained but extensible, showcasing
 * best practices for a production-ready React application.
 */

import React, { useState, useCallback, createContext, useContext, ReactNode, useMemo, memo } from 'react';
import { generateCommitMessage } from '../../services/geminiService.ts'; // Existing import
import { GitBranchIcon } from '../icons/FeatureIcons.tsx'; // Existing import
import { LoadingSpinner } from './shared/LoadingSpinner.tsx'; // Existing import

// --- Utility Functions ---

/**
 * Safely retrieves and parses JSON from localStorage, returning a default value on error or absence.
 * @template T The expected type of the stored value.
 * @param {string} key The key to retrieve from localStorage.
 * @param {T} defaultValue The value to return if parsing fails or the item is not found.
 * @returns {T} The parsed value or the default value.
 */
function getFromLocalStorage<T>(key: string, defaultValue: T): T {
    try {
        const item = localStorage.getItem(key);
        return item ? (JSON.parse(item) as T) : defaultValue;
    } catch (error) {
        console.error(`Error reading or parsing localStorage key "${key}":`, error);
        return defaultValue;
    }
}

/**
 * Safely stores a value in localStorage after serializing it to JSON.
 * @template T The type of the value to store.
 * @param {string} key The key to set.
 * @param {T} value The value to store.
 */
function setToLocalStorage<T>(key: string, value: T): void {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error writing to localStorage key "${key}":`, error);
    }
}


// --- Types Definitions ---

/**
 * @interface AiCommitGeneratorProps
 * @description
 * Props for the AiCommitGenerator component. Currently empty, but reserved
 * for future enhancements like initial diff input or external configuration.
 */
export interface AiCommitGeneratorProps {
    // initialDiff?: string; // Example: Pass an initial diff from a parent component
}

/**
 * @interface CommitHistoryEntry
 * @description
 * Represents a single entry in the commit history, including the original diff,
 * the generated message, a unique ID, and a timestamp.
 */
export interface CommitHistoryEntry {
    id: string;
    diff: string;
    message: string;
    timestamp: number;
}

/**
 * @interface CommitGeneratorState
 * @description
 * Defines the shape of the dynamic state managed by the CommitGeneratorContext.
 * This includes the current diff input, generated message, loading status, and any errors.
 */
export interface CommitGeneratorState {
    diff: string;
    message: string;
    isLoading: boolean;
    error: string;
}

/**
 * @interface CommitGeneratorActions
 * @description
 * Defines the actions (state setters and derived functions) available
 * through the CommitGeneratorContext for managing the generator's state.
 */
export interface CommitGeneratorActions {
    setDiff: (diff: string) => void;
    setMessage: (message: string) => void;
    setIsLoading: (loading: boolean) => void;
    setError: (error: string) => void;
    handleGenerate: () => Promise<void>;
    handleClearInput: () => void;
    handleCopyMessage: () => void;
}

/**
 * @interface CommitHistoryContextType
 * @description
 * Defines the shape of the state and actions managed by the CommitHistoryContext.
 * This includes the array of historical commit entries and functions to manipulate it.
 */
export interface CommitHistoryContextType {
    history: CommitHistoryEntry[];
    addHistoryEntry: (entry: Omit<CommitHistoryEntry, 'id' | 'timestamp'>) => void;
    clearHistory: () => void;
}


// --- Component: ErrorBoundary ---

/**
 * @interface ErrorBoundaryProps
 * @description
 * Props for the ErrorBoundary component.
 * @property {ReactNode} children - The child components that the ErrorBoundary will protect.
 * @property {ReactNode} [fallback] - Optional custom UI to render when an error occurs.
 */
interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

/**
 * @interface ErrorBoundaryState
 * @description
 * State for the ErrorBoundary component.
 * @property {boolean} hasError - Indicates if an error has been caught.
 * @property {Error | null} error - The error object if an error was caught.
 */
interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * @class ErrorBoundary
 * @description
 * A React Error Boundary component that catches JavaScript errors anywhere
 * in its child component tree, logs those errors, and displays a fallback UI.
 * This prevents the entire application from crashing due to unexpected UI errors.
 *
 * Implements `componentDidCatch` for error logging and `getDerivedStateFromError`
 * to update state and render a fallback UI.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    /**
     * @static getDerivedStateFromError
     * @description
     * This lifecycle method is called after an error has been thrown by a
     * descendant component. It receives the error as an argument and should
     * return a value to update state.
     * @param {Error} error The error that was thrown.
     * @returns {ErrorBoundaryState} An object to update the state, indicating an error occurred.
     */
    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    /**
     * @method componentDidCatch
     * @description
     * This lifecycle method is called after an error has been thrown. It receives
     * two arguments: the error that was thrown and an object with information
     * about which component caught the error. It's used for logging errors to
     * an error reporting service.
     * @param {Error} error The error that was thrown.
     * @param {React.ErrorInfo} errorInfo An object with a `componentStack` key, containing
     *                                    information about which component caught the error.
     */
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        // In a real application, you would log this to an error reporting service like Sentry, Bugsnag, etc.
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        // Example: myErrorLogger.logError(error, errorInfo);
    }

    render(): ReactNode {
        if (this.state.hasError) {
            // Render the provided fallback UI or a default one
            return this.props.fallback || (
                <div className="flex flex-col items-center justify-center p-8 bg-red-900/20 text-red-300 rounded-lg border border-red-700 min-h-[200px]" role="alert">
                    <h2 className="text-xl font-bold mb-2">Oops! Something went wrong.</h2>
                    <p className="text-sm text-center">
                        We're sorry, an unexpected error occurred. Please try refreshing the page.
                    </p>
                    {this.state.error && (
                        <details className="mt-4 p-2 bg-red-900 rounded-md text-xs max-w-lg overflow-auto">
                            <summary className="cursor-pointer">Error Details</summary>
                            <pre className="whitespace-pre-wrap font-mono text-red-200">{this.state.error.message}</pre>
                            {/* For debugging, you might include the stack trace: */}
                            {/* {this.state.error.stack && <pre className="whitespace-pre-wrap font-mono text-red-200 mt-2">{this.state.error.stack}</pre>} */}
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}


// --- Context: CommitGenerator ---

const CommitGeneratorContext = createContext<
    (CommitGeneratorState & CommitGeneratorActions) | undefined
>(undefined);

/**
 * @function useCommitGenerator
 * @description
 * Custom hook to access the CommitGeneratorContext.
 * It provides the current state (`diff`, `message`, `isLoading`, `error`)
 * and actions (`setDiff`, `setMessage`, `setIsLoading`, `setError`,
 * `handleGenerate`, `handleClearInput`, `handleCopyMessage`) related
 * to the AI commit message generation process.
 * Throws an error if used outside of a CommitGeneratorProvider.
 * @returns {CommitGeneratorState & CommitGeneratorActions} The current state and actions of the CommitGenerator.
 */
export const useCommitGenerator = (): (CommitGeneratorState & CommitGeneratorActions) => {
    const context = useContext(CommitGeneratorContext);
    if (context === undefined) {
        throw new Error('useCommitGenerator must be used within a CommitGeneratorProvider');
    }
    return context;
};

/**
 * A default example Git diff used for initial state and local storage fallback.
 * This provides a quick start for users without requiring immediate input.
 */
const exampleDiff = `diff --git a/src/components/Button.tsx b/src/components/Button.tsx
index 1b2c3d4..5e6f7g8 100644
--- a/src/components/Button.tsx
+++ b/src/components/Button.tsx
@@ -1,7 +1,7 @@
 import React from 'react';

 interface ButtonProps {
-  text: string;
+  label: string;
   onClick: () => void;
 }
`;

/**
 * @component CommitGeneratorProvider
 * @description
 * Provides the state and actions for the AI Commit Generator to its children.
 * Manages the diff input, generated message, loading status, and errors.
 * Persists the `diff` input to `localStorage` for user convenience.
 */
export const CommitGeneratorProvider: React.FC<{ children: ReactNode }> = memo(({ children }) => {
    const [diff, setDiff] = useState<string>(() =>
        getFromLocalStorage('aiCommitGenerator:diffInput', exampleDiff)
    );
    const [message, setMessage] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    // Persist diff input to local storage whenever it changes
    React.useEffect(() => {
        setToLocalStorage('aiCommitGenerator:diffInput', diff);
    }, [diff]);

    /**
     * @function handleGenerate
     * @description
     * Asynchronously generates a commit message using the AI service based on the current diff.
     * Manages loading, error, and success states during the API call.
     */
    const handleGenerate = useCallback(async () => {
        if (!diff.trim()) {
            setError('Please paste a diff to generate a message.');
            setMessage('');
            return;
        }
        setIsLoading(true);
        setError('');
        setMessage(''); // Clear previous message before new generation
        try {
            const result = await generateCommitMessage(diff);
            setMessage(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate message: ${errorMessage}`);
            setMessage(''); // Clear message on error
        } finally {
            setIsLoading(false);
        }
    }, [diff]);

    /**
     * @function handleClearInput
     * @description
     * Clears the current diff input, generated message, and any active error.
     */
    const handleClearInput = useCallback(() => {
        setDiff('');
        setMessage('');
        setError('');
    }, []);

    /**
     * @function handleCopyMessage
     * @description
     * Copies the currently generated commit message to the user's clipboard.
     */
    const handleCopyMessage = useCallback(() => {
        if (message) {
            navigator.clipboard.writeText(message);
            // In a real app, you might add a temporary "Copied!" notification
        }
    }, [message]);

    const value = useMemo(() => ({
        diff,
        setDiff,
        message,
        setMessage,
        isLoading,
        setIsLoading,
        error,
        setError,
        handleGenerate,
        handleClearInput,
        handleCopyMessage,
    }), [
        diff, message, isLoading, error,
        // Setters are stable, but explicitly listing them for completeness in the dependency array
        setDiff, setMessage, setIsLoading, setError,
        handleGenerate, handleClearInput, handleCopyMessage
    ]);

    return (
        <CommitGeneratorContext.Provider value={value}>
            {children}
        </CommitGeneratorContext.Provider>
    );
});


// --- Context: CommitHistory ---

const CommitHistoryContext = createContext<CommitHistoryContextType | undefined>(undefined);

/**
 * @function useCommitHistory
 * @description
 * Custom hook to access the CommitHistoryContext.
 * It provides the array of historical commit messages and functions
 * (`addHistoryEntry`, `clearHistory`) to manage this history.
 * Throws an error if used outside of a CommitHistoryProvider.
 * @returns {CommitHistoryContextType} The current state and actions of the CommitHistory.
 */
export const useCommitHistory = (): CommitHistoryContextType => {
    const context = useContext(CommitHistoryContext);
    if (context === undefined) {
        throw new Error('useCommitHistory must be used within a CommitHistoryProvider');
    }
    return context;
};

/**
 * @component CommitHistoryProvider
 * @description
 * Provides commit history management to its children. It loads and persists
 * the commit history to `localStorage`, ensuring data is saved across sessions.
 * New entries are added with a unique ID and timestamp.
 */
export const CommitHistoryProvider: React.FC<{ children: ReactNode }> = memo(({ children }) => {
    const [history, setHistory] = useState<CommitHistoryEntry[]>(() =>
        getFromLocalStorage('aiCommitGenerator:commitHistory', [])
    );

    // Persist history to local storage whenever it changes
    React.useEffect(() => {
        setToLocalStorage('aiCommitGenerator:commitHistory', history);
    }, [history]);

    /**
     * @function addHistoryEntry
     * @description
     * Adds a new commit message entry to the history. It automatically generates
     * a unique ID and timestamp for the entry.
     * @param {Omit<CommitHistoryEntry, 'id' | 'timestamp'>} entry The partial entry containing diff and message.
     */
    const addHistoryEntry = useCallback((entry: Omit<CommitHistoryEntry, 'id' | 'timestamp'>) => {
        setHistory(prevHistory => [
            {
                ...entry,
                id: crypto.randomUUID(), // Generates a unique ID
                timestamp: Date.now(),
            },
            ...prevHistory, // Newest entries appear first
        ]);
    }, []);

    /**
     * @function clearHistory
     * @description
     * Clears all entries from the commit history.
     */
    const clearHistory = useCallback(() => {
        setHistory([]);
    }, []);

    const value = useMemo(() => ({
        history,
        addHistoryEntry,
        clearHistory,
    }), [history, addHistoryEntry, clearHistory]);

    return (
        <CommitHistoryContext.Provider value={value}>
            {children}
        </CommitHistoryContext.Provider>
    );
});


// --- Component: AiCommitGeneratorComponent (Internal UI Component) ---

/**
 * @component AiCommitGeneratorComponent
 * @description
 * The core UI component for generating AI commit messages.
 * It consumes the `CommitGeneratorContext` for its primary functionality
 * and `CommitHistoryContext` to persist and display generated messages.
 *
 * This component showcases a robust, accessible, and performant approach
 * to building a complex form-like application with external service integration.
 */
const AiCommitGeneratorComponent: React.FC<AiCommitGeneratorProps> = () => {
    const {
        diff, setDiff, message, isLoading, error,
        handleGenerate, handleClearInput, handleCopyMessage
    } = useCommitGenerator();
    const { history, addHistoryEntry, clearHistory } = useCommitHistory();

    /**
     * @function useEffect
     * @description
     * Effect hook to automatically add a successfully generated message to the history.
     * It prevents duplicate entries if the message and diff haven't changed.
     */
    React.useEffect(() => {
        if (message && !isLoading && !error) {
            // Check if this specific message for this diff hasn't just been added to avoid duplicates on re-render
            const latestHistoryItem = history[0];
            if (!latestHistoryItem || latestHistoryItem.diff !== diff || latestHistoryItem.message !== message) {
                 addHistoryEntry({ diff, message });
            }
        }
    }, [message, diff, isLoading, error, addHistoryEntry, history]);


    /**
     * @function renderLoadingState
     * @description
     * Renders the loading spinner and message when an AI commit message is being generated.
     * Includes ARIA attributes for accessibility.
     * @returns {JSX.Element} The loading state UI.
     */
    const renderLoadingState = (): JSX.Element => (
        <div role="status" aria-live="polite" className="flex flex-col items-center justify-center h-full text-slate-400">
            <LoadingSpinner className="text-cyan-500" />
            <p className="mt-3 text-sm">Generating commit message...</p>
            <span className="sr-only">Loading, please wait.</span>
        </div>
    );

    /**
     * @function renderErrorState
     * @description
     * Renders an error message when the AI commit message generation fails.
     * Includes ARIA attributes for accessibility.
     * @returns {JSX.Element} The error state UI.
     */
    const renderErrorState = (): JSX.Element => (
        <div role="alert" aria-live="assertive" className="text-red-400 p-4 rounded-md bg-red-900/20 border border-red-700">
            <h3 className="font-bold text-lg mb-1">Error</h3>
            <p className="text-sm">{error}</p>
        </div>
    );

    /**
     * @function renderMessageDisplay
     * @description
     * Renders the generated commit message with a copy button.
     * @returns {JSX.Element} The message display UI.
     */
    const renderMessageDisplay = (): JSX.Element => (
        <>
            <button
                onClick={handleCopyMessage}
                className="absolute top-2 right-2 px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-md text-xs text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                aria-label="Copy generated commit message to clipboard"
                title="Copy Message"
            >
                Copy
            </button>
            <pre className="whitespace-pre-wrap font-sans text-slate-200 text-sm p-2 pt-8">{message}</pre>
        </>
    );

    /**
     * @function renderEmptyState
     * @description
     * Renders a placeholder message when no commit message has been generated yet.
     * @returns {JSX.Element} The empty state UI.
     */
    const renderEmptyState = (): JSX.Element => (
        <div className="text-slate-500 h-full flex items-center justify-center text-center p-4 text-sm">
            The generated commit message will appear here. Paste your diff in the left panel and click "Generate".
        </div>
    );

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 bg-slate-950 text-slate-100 font-sans">
            {/* SEO: For a real enterprise app, SEO metadata is typically handled by a dedicated library like react-helmet,
                a meta framework like Next.js (via `next/head`), or server-side rendering setup.
                Directly injecting <title> and <meta> here is for illustrative purposes in a self-contained file. */}
            <title>AI Commit Generator - Gemini Powered | Enterprise Solution</title>
            <meta name="description" content="Generate intelligent, production-ready Git commit messages using AI for your code diffs. Enhance productivity with Gemini." />
            <meta name="keywords" content="AI, Git, commit message, generator, Gemini, code, diff, enterprise, production, developer tools" />
            <meta name="author" content="James Burvel O’Callaghan III, Citibank Demo Business Inc." />
            <link rel="icon" href="/favicon.ico" /> {/* Placeholder for actual favicon */}

            <header className="mb-6 border-b border-slate-800 pb-4">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-cyan-400 flex items-center leading-tight">
                    <GitBranchIcon className="w-8 h-8 sm:w-10 sm:h-10 mr-3 text-cyan-500" aria-hidden="true" />
                    <span className="truncate">AI Commit Message Generator</span>
                </h1>
                <p className="text-slate-400 mt-2 text-md sm:text-lg max-w-2xl">
                    Harness the power of cutting-edge AI to craft precise and effective commit messages from your Git diffs. Streamline your workflow, enhance collaboration, and maintain pristine commit history.
                </p>
            </header>

            <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-hidden">
                {/* Diff Input Panel */}
                <section className="flex flex-col h-full lg:col-span-2 bg-slate-900 rounded-lg shadow-xl p-4 border border-slate-800">
                    <label htmlFor="diff-input" className="text-sm font-medium text-slate-300 mb-2 sr-only">Git Diff Input</label>
                    <h2 className="text-xl font-semibold text-slate-200 mb-3 flex items-center">
                        <span role="img" aria-label="Memo icon" className="mr-2 text-lg">📝</span> Git Diff Input
                    </h2>
                    <textarea
                        id="diff-input"
                        value={diff}
                        onChange={(e) => setDiff(e.target.value)}
                        placeholder="Paste your git diff here (e.g., from `git diff` or `git diff --staged`)..."
                        className="flex-grow p-4 bg-slate-800 border border-slate-700 rounded-md resize-none font-mono text-sm text-slate-300 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-colors duration-200 min-h-[150px] lg:min-h-0"
                        aria-label="Git diff input area"
                        aria-describedby="diff-input-instructions"
                        spellCheck="false" // Diff often contains code, disable spellcheck
                    />
                    <p id="diff-input-instructions" className="sr-only">
                        Paste the output of your git diff command into this text area to generate a commit message.
                    </p>
                     <div className="flex flex-col sm:flex-row gap-4 mt-4">
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || !diff.trim()}
                            className="flex-grow flex items-center justify-center px-6 py-3 bg-cyan-600 text-white font-bold rounded-md hover:bg-cyan-500 transition-colors disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            aria-live="polite"
                            aria-busy={isLoading}
                            aria-label={isLoading ? "Generating commit message" : "Generate commit message"}
                            title="Generate Commit Message"
                        >
                            {isLoading ? (
                                <>
                                    <LoadingSpinner className="mr-3 text-white" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                    Generate Commit Message
                                </>
                            )}
                        </button>
                         <button
                            onClick={handleClearInput}
                            disabled={isLoading || !diff.trim()}
                            className="flex-grow sm:flex-grow-0 px-6 py-3 bg-slate-700 text-slate-200 font-bold rounded-md hover:bg-slate-600 transition-colors disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-500"
                            aria-label="Clear diff input area"
                            title="Clear Input"
                        >
                            Clear Input
                        </button>
                    </div>
                </section>

                {/* Generated Message & History Panel */}
                <aside className="flex flex-col h-full lg:col-span-1 space-y-6">
                    {/* Generated Message */}
                    <section className="flex flex-col flex-shrink-0 bg-slate-900 rounded-lg shadow-xl p-4 relative flex-grow min-h-[200px] border border-slate-800">
                        <label className="text-sm font-medium text-slate-300 mb-2 sr-only">Generated Message Output</label>
                        <h2 className="text-xl font-semibold text-slate-200 mb-3 flex items-center">
                             <span role="img" aria-label="Chat bubble icon" className="mr-2 text-lg">💬</span> Generated Message
                        </h2>
                        <div
                            className="relative flex-grow p-1 bg-slate-800 border border-slate-700 rounded-md overflow-y-auto min-h-[100px]"
                            aria-live="polite" // Announce changes to screen readers
                            aria-atomic="true" // Announce the entire region's content
                        >
                            {isLoading && renderLoadingState()}
                            {!isLoading && error && renderErrorState()}
                            {!isLoading && message && !error && renderMessageDisplay()}
                            {!isLoading && !message && !error && renderEmptyState()}
                        </div>
                    </section>

                    {/* Commit History */}
                    <section className="flex flex-col flex-grow bg-slate-900 rounded-lg shadow-xl p-4 border border-slate-800 min-h-[200px] lg:min-h-[unset]">
                        <h2 className="text-xl font-semibold text-slate-200 mb-3 flex items-center justify-between">
                            <span className="flex items-center"><span role="img" aria-label="Books icon" className="mr-2 text-lg">📚</span> Commit History</span>
                            <button
                                onClick={clearHistory}
                                disabled={history.length === 0}
                                className="text-xs text-red-400 hover:text-red-300 disabled:text-red-900 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 p-1 rounded"
                                aria-label="Clear all commit history entries"
                                title="Clear History"
                            >
                                Clear All
                            </button>
                        </h2>
                        <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar" aria-label="List of past generated commit messages">
                            {history.length === 0 ? (
                                <p className="text-slate-500 text-sm italic text-center p-4">No commit messages in history yet. Generate one to see it here!</p>
                            ) : (
                                <ul className="space-y-3">
                                    {history.map((entry) => (
                                        <li key={entry.id} className="bg-slate-800 p-3 rounded-md border border-slate-700">
                                            <p className="font-semibold text-cyan-400 text-sm mb-1 line-clamp-2">{entry.message}</p>
                                            <p className="text-slate-500 text-xs italic">
                                                {new Date(entry.timestamp).toLocaleString()}
                                            </p>
                                            <details className="mt-2 text-xs text-slate-400">
                                                <summary className="cursor-pointer hover:text-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500 rounded">Show Diff</summary>
                                                <pre className="mt-1 p-2 bg-slate-700/50 rounded max-h-24 overflow-auto whitespace-pre-wrap font-mono text-slate-300">
                                                    {entry.diff}
                                                </pre>
                                            </details>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </section>
                </aside>
            </main>
        </div>
    );
};

// --- Top-level Component Wrapper for Contexts and Error Boundary ---

/**
 * @component AiCommitGenerator
 * @description
 * The main exported component that wraps the core generator UI
 * (`AiCommitGeneratorComponent`) with necessary providers
 * (`CommitGeneratorProvider`, `CommitHistoryProvider`) and an `ErrorBoundary`
 * for robust, enterprise-grade functionality.
 * This compositional structure makes the internal UI component more focused
 * on presentation and interaction logic, while abstracting infrastructure concerns.
 */
export const AiCommitGenerator = memo((props: AiCommitGeneratorProps) => (
    <ErrorBoundary>
        <CommitHistoryProvider>
            <CommitGeneratorProvider>
                <AiCommitGeneratorComponent {...props} />
            </CommitGeneratorProvider>
        </CommitHistoryProvider>
    </ErrorBoundary>
));


// Note: For a truly self-contained file with custom scrollbar styling,
// you might embed CSS like this in a <style> tag. However, in modern React
// and enterprise applications, this is generally managed via global CSS files,
// CSS-in-JS libraries, or build processes like PostCSS with Tailwind.
/*
<style>
.custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: #1e293b; // slate-800
    border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #334155; // slate-700
    border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #475569; // slate-600
}

.custom-scrollbar {
    scrollbar-width: thin; // Firefox
    scrollbar-color: #334155 #1e293b; // Firefox
}
</style>
*/
```