```tsx
// Copyright James Burvel Oâ€™Callaghan III
// President Citibank Demo Business Inc.

// app.tsx
//
// This file represents a polished, enterprise-grade React application, combining
// all components into a single file for demonstration purposes. It includes
// best practices for production-ready, maintainable, and scalable applications.
//
// Features:
// - **Single File Structure:** All components, contexts, and utilities are
//   self-contained within this app.tsx, organized with comments.
// - **Routing:** Utilizes React Router DOM for navigation between pages.
// - **State Management:** Implements React Context API for global state (e.g., theming).
// - **Error Handling:** Integrates a robust Error Boundary for graceful error presentation.
// - **TypeScript:** Strictly typed throughout for enhanced developer experience and code quality.
// - **Performance Optimization:** Leverages React.memo, useCallback, and useMemo for efficiency.
// - **Responsive Design:** Styling (Tailwind CSS) includes responsive considerations.
// - **Accessibility (A11y):** Focus on semantic HTML, ARIA attributes, and keyboard navigation.
// - **SEO:** Integrates react-helmet-async for managing document head metadata.
// - **Loading States:** Demonstrates handling of loading states for async operations.
// - **Documentation:** Clear comments for components, props, and functions.
//
// External Dependencies (minimal and standard):
// - React, react-dom (core React library)
// - react-router-dom (for routing)
// - react-helmet-async (for SEO)
//
// To run this file:
// 1. Ensure you have Node.js and npm/yarn installed.
// 2. Create a new React project (e.g., `npx create-react-app my-app --template typescript` or `npx create-next-app my-app --typescript`).
// 3. Install dependencies: `npm install react-router-dom react-helmet-async` (if not already included).
// 4. Replace your project's `src/App.tsx` with the content of this file.
// 5. Ensure Tailwind CSS is configured in your project if you want the styles to render correctly.
// 6. Remove the original `ClipboardToCode.tsx` and `icons/FeatureIcons.tsx` files.
// 7. Start the development server: `npm start`.

import React, { useState, useEffect, createContext, useContext, useCallback, useMemo, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Outlet, NavLink } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';

// =============================================================================
//  TYPE DEFINITIONS
// =============================================================================

/**
 * @typedef {Object} ThemeContextType
 * @property {'light' | 'dark'} theme - The current theme mode.
 * @property {() => void} toggleTheme - Function to toggle the theme.
 */
interface ThemeContextType {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

/**
 * @typedef {Object} ErrorBoundaryProps
 * @property {React.ReactNode} children - Child components to render.
 * @property {React.ReactNode} fallback - UI to render when an error occurs.
 */
interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback: React.ReactNode;
}

/**
 * @typedef {Object} ErrorBoundaryState
 * @property {boolean} hasError - True if an error has occurred.
 */
interface ErrorBoundaryState {
    hasError: boolean;
}

/**
 * @typedef {Object} ClipboardToCodePageProps
 * @property {string} title - The title of the page/feature.
 * @property {string} description - A brief description for the page.
 */
interface ClipboardToCodePageProps {
    title?: string;
    description?: string;
}

/**
 * @typedef {Object} CodeBracketIconProps
 * @property {string} className - Optional Tailwind CSS classes for styling the icon.
 */
interface CodeBracketIconProps {
    className?: string;
}

// =============================================================================
//  UTILITY COMPONENTS & HOOKS
// =============================================================================

/**
 * @component CodeBracketIcon
 * @description Renders a simple SVG icon resembling a code bracket.
 * @param {CodeBracketIconProps} props - The component props.
 * @returns {JSX.Element} The rendered SVG icon.
 */
export const CodeBracketIcon: React.FC<CodeBracketIconProps> = ({ className = "h-7 w-7 text-cyan-400" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
);

/**
 * @hook useLocalStorage
 * @description A custom React hook for persisting state in localStorage.
 * @template T
 * @param {string} key - The key to use for localStorage.
 * @param {T} initialValue - The initial value for the state.
 * @returns {[T, React.Dispatch<React.SetStateAction<T>>]} A tuple containing the state value and a setter function.
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error("Error reading from localStorage:", error);
            return initialValue;
        }
    });

    const setValue = useCallback((value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error("Error writing to localStorage:", error);
        }
    }, [key, storedValue]);

    return [storedValue, setValue];
}

/**
 * @component LoadingSpinner
 * @description A simple circular loading spinner animation.
 * @returns {JSX.Element} The rendered loading spinner.
 */
export const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 dark:border-cyan-600"></div>
    </div>
);

/**
 * @component FallbackUI
 * @description A generic fallback UI for error boundaries or suspense.
 * @param {Object} props - The component props.
 * @param {string} [props.message="Something went wrong."] - The message to display.
 * @param {() => void} [props.onRetry] - An optional function to call on retry.
 * @returns {JSX.Element} The rendered fallback UI.
 */
export const FallbackUI: React.FC<{ message?: string; onRetry?: () => void }> = ({ message = "Something went wrong.", onRetry }) => (
    <div className="flex flex-col items-center justify-center p-8 bg-red-800 bg-opacity-30 rounded-lg text-red-100 border border-red-700 mx-auto max-w-lg mt-8 shadow-lg">
        <h2 className="text-xl font-semibold mb-3">Application Error</h2>
        <p className="text-center mb-4">{message}</p>
        {onRetry && (
            <button
                onClick={onRetry}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                aria-label="Retry operation"
            >
                Retry
            </button>
        )}
    </div>
);

// =============================================================================
//  CONTEXTS
// =============================================================================

/**
 * @constant ThemeContext
 * @description React Context for managing and providing the current theme.
 */
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * @component ThemeProvider
 * @description Provides the theme and theme toggling functionality to its children.
 *              Persists the theme choice in local storage.
 * @param {Object} props - The component props.
 * @param {React.ReactNode} props.children - The child components to render within the theme context.
 * @returns {JSX.Element} The rendered ThemeProvider.
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('app-theme', 'dark');

    const toggleTheme = useCallback(() => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    }, [setTheme]);

    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [theme]);

    const contextValue = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

    return (
        <ThemeContext.Provider value={contextValue}>
            {children}
        </ThemeContext.Provider>
    );
};

/**
 * @hook useTheme
 * @description Custom hook to easily access the theme context.
 * @returns {ThemeContextType} The current theme and toggle function.
 * @throws {Error} If used outside of a ThemeProvider.
 */
export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

// =============================================================================
//  ERROR BOUNDARY
// =============================================================================

/**
 * @class ErrorBoundary
 * @description A React component that catches JavaScript errors anywhere in its child component tree,
 *              logs those errors, and displays a fallback UI instead of crashing the application.
 *              This is crucial for enterprise-grade applications.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    /**
     * @method getDerivedStateFromError
     * @description Static method to update state so the next render will show the fallback UI.
     * @param {Error} error - The error that was thrown.
     * @returns {ErrorBoundaryState} New state indicating an error has occurred.
     */
    static getDerivedStateFromError(_: Error): ErrorBoundaryState {
        return { hasError: true };
    }

    /**
     * @method componentDidCatch
     * @description Lifecycle method to log error information.
     * @param {Error} error - The error that was thrown.
     * @param {React.ErrorInfo} errorInfo - Component stack information.
     */
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        // In a real application, you would send this error to an error reporting service
        // (e.g., Sentry, Bugsnag, Datadog).
        // logErrorToService(error, errorInfo);
    }

    /**
     * @method handleRetry
     * @description Resets the error state to attempt re-rendering children.
     *              Useful for retrying an operation after an error.
     */
    handleRetry = () => {
        this.setState({ hasError: false });
    };

    render() {
        if (this.state.hasError) {
            return (
                <FallbackUI message="Oops! Something unexpected happened. Please try again." onRetry={this.handleRetry} />
            );
        }
        return this.props.children;
    }
}

// =============================================================================
//  LAYOUT COMPONENTS
// =============================================================================

/**
 * @component Header
 * @description The main application header, including title, navigation, and theme toggle.
 * @returns {JSX.Element} The rendered header.
 */
export const Header: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="bg-slate-800 dark:bg-slate-900 shadow-md py-4 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between sticky top-0 z-50">
            <Link to="/" className="flex items-center text-white hover:text-cyan-400 transition-colors duration-200 mb-3 sm:mb-0">
                <CodeBracketIcon className="h-8 w-8 mr-2 text-cyan-500" />
                <h1 className="text-2xl font-bold">CodeVault App</h1>
            </Link>
            <nav className="flex items-center space-x-4">
                <NavLink
                    to="/"
                    className={({ isActive }) => `text-slate-300 hover:text-cyan-400 font-medium transition-colors duration-200 ${isActive ? 'text-cyan-400 border-b-2 border-cyan-400 pb-1' : ''}`}
                    aria-label="Navigate to Home page"
                >
                    Home
                </NavLink>
                <NavLink
                    to="/clipboard-to-code"
                    className={({ isActive }) => `text-slate-300 hover:text-cyan-400 font-medium transition-colors duration-200 ${isActive ? 'text-cyan-400 border-b-2 border-cyan-400 pb-1' : ''}`}
                    aria-label="Navigate to Clipboard to Code feature"
                >
                    Clipboard-to-Code
                </NavLink>
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white transition-colors duration-200"
                    aria-label={`Toggle theme to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    {theme === 'dark' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M3 12H5.25m-.386-6.364l1.591 1.591M12 12a3 3 0 110-6 3 3 0 010 6zm0 6a3 3 0 110-6 3 3 0 010 6z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0112 21.75c-3.618 0-6.955-1.844-8.89-4.992a.75.75 0 01.416-1.026c.144-.06.27-.123.389-.187A7.954 7.954 0 0012 12c.704 0 1.39.096 2.048.274a1.05 1.05 0 01.3-.064 7.502 7.502 0 005.908-4.474.75.75 0 011.262.302c.088.243.088.513.003.756l-.001.006z" />
                        </svg>
                    )}
                </button>
            </nav>
        </header>
    );
};

/**
 * @component Footer
 * @description The main application footer, displaying copyright information.
 * @returns {JSX.Element} The rendered footer.
 */
export const Footer: React.FC = () => {
    return (
        <footer className="bg-slate-800 dark:bg-slate-900 text-slate-400 dark:text-slate-500 text-center py-4 px-4 sm:px-6 lg:px-8 mt-auto text-sm">
            <p>&copy; {new Date().getFullYear()} CodeVault App. All rights reserved by James Burvel O'Callaghan III, President Citibank Demo Business Inc.</p>
        </footer>
    );
};

// =============================================================================
//  PAGE COMPONENTS
// =============================================================================

/**
 * @component HomePage
 * @description A simple welcome page for the application.
 * @returns {JSX.Element} The rendered home page.
 */
export const HomePage: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] p-4 text-center">
            <Helmet>
                <title>Welcome to CodeVault App</title>
                <meta name="description" content="Welcome to CodeVault, your personal utility for managing code snippets and developer tools." />
            </Helmet>
            <h2 className="text-5xl font-extrabold text-slate-100 mb-6 animate-fade-in">
                Welcome to CodeVault!
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl leading-relaxed animate-fade-in animation-delay-300">
                Your ultimate companion for managing code snippets, transforming text, and boosting your productivity.
            </p>
            <div className="space-x-4">
                <Link
                    to="/clipboard-to-code"
                    className="px-8 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-cyan-500 focus:ring-opacity-50 inline-flex items-center animate-bounce-in animation-delay-600"
                    aria-label="Go to Clipboard-to-Code feature"
                >
                    <CodeBracketIcon className="h-6 w-6 mr-2 text-white" />
                    Get Started
                </Link>
            </div>
            <div className="mt-12 text-slate-400 animate-fade-in animation-delay-900">
                <p>Explore powerful features designed for developers.</p>
            </div>
        </div>
    );
};


/**
 * @component ClipboardToCodePage
 * @description Allows users to paste text from their clipboard, automatically wrapping it in a code block.
 *              Includes loading state, accessibility features, and uses React.memo for performance.
 * @param {ClipboardToCodePageProps} props - The component props.
 * @returns {JSX.Element} The rendered Clipboard-to-Code interface.
 */
export const ClipboardToCodePage: React.FC<ClipboardToCodePageProps> = React.memo(({
    title = "Clipboard-to-Code Mode",
    description = "Paste any content into the text area below to automatically wrap it in a code block."
}) => {
    const [content, setContent] = useState<string>('');
    const [isPasting, setIsPasting] = useState<boolean>(false);
    const [pasteError, setPasteError] = useState<string | null>(null);

    /**
     * @function handlePaste
     * @description Handles the paste event, reads clipboard text, wraps it in a code block, and updates content.
     * @param {React.ClipboardEvent<HTMLTextAreaElement>} e - The paste event.
     * @returns {Promise<void>}
     */
    const handlePaste = useCallback(async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        e.preventDefault();
        setIsPasting(true);
        setPasteError(null);
        try {
            // navigator.clipboard.readText() is an async operation,
            // though usually fast, we demonstrate loading/error states.
            const pastedText = await navigator.clipboard.readText();
            if (pastedText) {
                const newContent = `${content}${content ? '\n\n' : ''}\`\`\`\n${pastedText}\n\`\`\``;
                setContent(newContent);
            } else {
                setPasteError("No text found in clipboard or permission denied.");
            }
        } catch (error) {
            console.error("Failed to read clipboard:", error);
            setPasteError("Failed to read clipboard. Please ensure browser permissions are granted.");
        } finally {
            setIsPasting(false);
        }
    }, [content]); // Recreate if 'content' changes

    /**
     * @function handleChange
     * @description Handles manual changes to the textarea content.
     * @param {React.ChangeEvent<HTMLTextAreaElement>} e - The change event.
     */
    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        setPasteError(null); // Clear error on manual edit
    }, []);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 flex-grow dark:bg-slate-900 bg-slate-100 text-slate-100 dark:text-slate-300">
            <Helmet>
                <title>{title} | CodeVault App</title>
                <meta name="description" content={description} />
                <meta property="og:title" content={title} />
                <meta property="og:description" content={description} />
            </Helmet>

            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 dark:text-cyan-300 flex items-center">
                    <CodeBracketIcon />
                    <span className="ml-3">{title}</span>
                </h1>
                <p className="text-slate-400 mt-1">{description}</p>
            </header>

            <div className="flex-grow flex flex-col h-full relative">
                <label htmlFor="paste-area" className="text-sm font-medium text-slate-400 dark:text-slate-300 mb-2 sr-only">Paste Zone</label>
                <textarea
                    id="paste-area"
                    value={content}
                    onPaste={handlePaste}
                    onChange={handleChange}
                    placeholder={isPasting ? "Pasting..." : "Paste here (Ctrl+V or Cmd+V)..."}
                    className={`flex-grow p-4 bg-slate-900 dark:bg-slate-800 border-2 border-dashed ${pasteError ? 'border-red-500' : 'border-slate-700 dark:border-slate-600'} rounded-md resize-none font-mono text-sm text-cyan-300 dark:text-cyan-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-colors duration-200`}
                    aria-label="Text area for pasting code snippets"
                    aria-describedby="paste-instructions paste-status"
                    disabled={isPasting}
                />

                {isPasting && (
                    <div className="absolute inset-0 bg-slate-900 dark:bg-slate-900 bg-opacity-70 dark:bg-opacity-70 flex justify-center items-center z-10 rounded-md">
                        <LoadingSpinner />
                    </div>
                )}

                {pasteError && (
                    <p id="paste-status" role="alert" aria-live="polite" className="text-red-400 text-sm mt-2 text-center">
                        {pasteError}
                    </p>
                )}

                {!isPasting && (
                    <p id="paste-instructions" className="sr-only">
                        To paste, press Ctrl+V on Windows/Linux or Cmd+V on macOS.
                    </p>
                )}
            </div>
            <div className="mt-4 flex justify-end space-x-2">
                <button
                    onClick={() => setContent('')}
                    disabled={!content.length || isPasting}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                    aria-label="Clear all content"
                >
                    Clear All
                </button>
                <button
                    onClick={() => navigator.clipboard.writeText(content)}
                    disabled={!content.length || isPasting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                    aria-label="Copy content to clipboard"
                >
                    Copy to Clipboard
                </button>
            </div>
        </div>
    );
});

/**
 * @component NotFoundPage
 * @description A 404 page for routes that don't exist.
 * @returns {JSX.Element} The rendered 404 page.
 */
export const NotFoundPage: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] p-4 text-center">
            <Helmet>
                <title>404 Not Found | CodeVault App</title>
                <meta name="description" content="The page you are looking for does not exist." />
            </Helmet>
            <h2 className="text-6xl font-extrabold text-red-500 mb-4 animate-bounce">404</h2>
            <p className="text-3xl font-semibold text-slate-200 mb-6">Page Not Found</p>
            <p className="text-lg text-slate-400 mb-8">
                The page you're trying to reach doesn't exist or has been moved.
            </p>
            <Link
                to="/"
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-cyan-500 focus:ring-opacity-50"
                aria-label="Go back to Home page"
            >
                Go to Home
            </Link>
        </div>
    );
};


// =============================================================================
//  ROOT APP COMPONENT
// =============================================================================

/**
 * @component App
 * @description The root component of the CodeVault application.
 *              It sets up routing, global theme, error boundaries, and the main layout.
 * @returns {JSX.Element} The main application interface.
 */
export const App: React.FC = () => {
    return (
        <HelmetProvider>
            <Router>
                <ThemeProvider>
                    <div className="flex flex-col min-h-screen bg-slate-950 dark:bg-slate-950 text-slate-100 dark:text-slate-300">
                        <Header />
                        <main className="flex-grow">
                            <ErrorBoundary fallback={<FallbackUI message="A critical error occurred. Please refresh or try again later." />}>
                                {/* Suspense is useful for lazy-loaded components. For small pages, it might not be strictly necessary,
                                    but it demonstrates enterprise readiness. */}
                                <Suspense fallback={<LoadingSpinner />}>
                                    <Routes>
                                        <Route path="/" element={<HomePage />} />
                                        <Route path="/clipboard-to-code" element={<ClipboardToCodePage />} />
                                        <Route path="*" element={<NotFoundPage />} /> {/* Catch-all for 404 */}
                                    </Routes>
                                </Suspense>
                            </ErrorBoundary>
                        </main>
                        <Footer />
                    </div>
                </ThemeProvider>
            </Router>
        </HelmetProvider>
    );
};

// Export the main App component as default for standard React project setup.
export default App;
```