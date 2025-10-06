```tsx
// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

/**
 * @file CodeSpellChecker.tsx
 * @description
 * This file represents a single-file, enterprise-grade React application,
 * demonstrating best practices for structure, state management, error handling,
 * performance, and accessibility, centered around a code spell-checking
 * simulation.
 *
 * It combines multiple conceptual components, including the main application
 * logic, a text highlighter, settings management, and infrastructure components
 * like an Error Boundary and SEO wrapper, into a single self-contained unit.
 *
 * Features:
 * - Root `App` component with routing.
 * - TypeScript for robust type checking.
 * - React Context API for application-wide settings (custom typos).
 * - Error Boundary for gracefully handling runtime errors.
 * - Loading and error states for simulated asynchronous operations.
 * - Responsive design using Tailwind CSS classes.
 * - Basic SEO metadata management using `react-helmet-async`.
 * - Accessibility improvements (ARIA attributes, semantic HTML).
 * - Memoization (`React.memo`, `useMemo`, `useCallback`) for performance optimization.
 * - Clear comments and documentation.
 *
 * This file can be dropped into a React project and run, assuming
 * `react-router-dom`, `react-helmet-async`, and Tailwind CSS are configured.
 */

import React, { useState, useMemo, useCallback, createContext, useContext, useEffect, Suspense, lazy, Fragment } from 'react';
import { BeakerIcon } from '../icons/FeatureIcons.tsx';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';

// =============================================================================
// GLOBAL TYPES AND INTERFACES
// =============================================================================

/**
 * @typedef {Object} CustomTypo
 * @property {string} id - Unique identifier for the typo.
 * @property {string} word - The misspelt word.
 * @property {string[]} suggestions - Optional array of suggested corrections.
 */
interface CustomTypo {
    id: string;
    word: string;
    suggestions?: string[];
}

/**
 * @typedef {Object} SpellCheckerSettings
 * @property {CustomTypo[]} customTypos - List of user-defined custom typos.
 * @property {(typo: string) => void} addCustomTypo - Function to add a new custom typo.
 */
interface SpellCheckerContextType {
    customTypos: CustomTypo[];
    addCustomTypo: (typo: string) => void;
    isLoadingTypos: boolean;
    typoFetchError: string | null;
}

// =============================================================================
// CONTEXT API
// =============================================================================

/**
 * @constant SpellCheckerSettingsContext
 * @description React Context for managing application-wide spell checker settings,
 *              such as custom typos added by the user.
 */
const SpellCheckerSettingsContext = createContext<SpellCheckerContextType | undefined>(undefined);

/**
 * @function useSpellCheckerSettings
 * @returns {SpellCheckerContextType} The context value for spell checker settings.
 * @throws {Error} If used outside of a `SpellCheckerSettingsProvider`.
 * @description Custom hook to easily access the spell checker settings context.
 */
export const useSpellCheckerSettings = (): SpellCheckerContextType => {
    const context = useContext(SpellCheckerSettingsContext);
    if (context === undefined) {
        throw new Error('useSpellCheckerSettings must be used within a SpellCheckerSettingsProvider');
    }
    return context;
};

/**
 * @function SpellCheckerSettingsProvider
 * @param {React.PropsWithChildren<{}>} props - Component props, expecting children.
 * @returns {JSX.Element} The provider component for spell checker settings.
 * @description Provides spell checker settings to its children components,
 *              including custom typos and functionality to add them.
 */
export const SpellCheckerSettingsProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const [initialTypos, setInitialTypos] = useState<string[]>(['funtion', 'consle', 'varable', 'docment', 'componnet']);
    const [customTypos, setCustomTypos] = useState<CustomTypo[]>([]);
    const [isLoadingTypos, setIsLoadingTypos] = useState<boolean>(true);
    const [typoFetchError, setTypoFetchError] = useState<string | null>(null);

    // Simulate fetching initial custom typos from an API
    useEffect(() => {
        setIsLoadingTypos(true);
        setTypoFetchError(null);
        const fetchTypos = async () => {
            try {
                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 1000));
                const fetchedTypos: CustomTypo[] = [
                    { id: 'custom-1', word: 'aplication', suggestions: ['application'] },
                    { id: 'custom-2', word: 'interfaace', suggestions: ['interface'] },
                ];
                setCustomTypos(fetchedTypos);
            } catch (error) {
                console.error('Failed to fetch custom typos:', error);
                setTypoFetchError('Failed to load custom typos.');
            } finally {
                setIsLoadingTypos(false);
            }
        };
        fetchTypos();
    }, []);

    const addCustomTypo = useCallback((word: string) => {
        if (!word.trim()) return;
        setCustomTypos(prevTypos => {
            if (prevTypos.some(t => t.word.toLowerCase() === word.toLowerCase())) {
                return prevTypos; // Avoid duplicates
            }
            return [...prevTypos, { id: Date.now().toString(), word: word.toLowerCase() }];
        });
    }, []);

    // Combine initial static typos with dynamically loaded custom typos
    const allTypos = useMemo(() => {
        const combined = new Set([...initialTypos, ...customTypos.map(t => t.word)]);
        return Array.from(combined);
    }, [initialTypos, customTypos]);

    const contextValue = useMemo(() => ({
        customTypos: allTypos.map(word => ({ id: word, word })), // Convert to CustomTypo array for consistent type
        addCustomTypo,
        isLoadingTypos,
        typoFetchError,
    }), [allTypos, addCustomTypo, isLoadingTypos, typoFetchError]);

    return (
        <SpellCheckerSettingsContext.Provider value={contextValue}>
            {children}
        </SpellCheckerSettingsContext.Provider>
    );
};

// =============================================================================
// ERROR BOUNDARY
// =============================================================================

/**
 * @typedef {Object} ErrorBoundaryProps
 * @property {React.ReactNode} children - Child components to protect.
 * @property {React.ReactNode} fallback - UI to render when an error occurs.
 */
interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback: React.ReactNode;
}

/**
 * @typedef {Object} ErrorBoundaryState
 * @property {boolean} hasError - True if an error has occurred.
 * @property {Error | null} error - The error object.
 * @property {React.ErrorInfo | null} errorInfo - Information about the error component stack.
 */
interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

/**
 * @class ErrorBoundary
 * @extends {React.Component<ErrorBoundaryProps, ErrorBoundaryState>}
 * @description A reusable React Error Boundary component to catch JavaScript errors
 *              anywhere in its child component tree, log those errors, and display
 *              a fallback UI instead of the crashed component tree.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    /**
     * @static
     * @method getDerivedStateFromError
     * @param {Error} error - The error that was thrown.
     * @returns {ErrorBoundaryState} An update to state indicating an error.
     * @description This lifecycle method is called after an error has been thrown
     *              by a descendant component. It receives the error that was thrown
     *              as a parameter and should return a value to update the state.
     */
    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error, errorInfo: null };
    }

    /**
     * @method componentDidCatch
     * @param {Error} error - The error that was thrown.
     * @param {React.ErrorInfo} errorInfo - An object with a componentStack key.
     * @description This lifecycle method is invoked after an error has been thrown
     *              by a descendant component. It's used for logging error information.
     */
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // You can also log the error to an error reporting service
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="p-8 bg-red-900 text-white rounded-lg shadow-lg m-4" role="alert" aria-live="assertive">
                    <h2 className="text-2xl font-bold mb-2">Oops! Something went wrong.</h2>
                    <p className="mb-4">We're sorry for the inconvenience. Please try refreshing the page.</p>
                    {this.state.error && (
                        <details className="text-red-200">
                            <summary className="cursor-pointer">Error Details</summary>
                            <pre className="mt-2 text-xs overflow-auto bg-red-800 p-2 rounded">
                                {this.state.error.toString()}
                                {this.state.errorInfo && this.state.errorInfo.componentStack}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

// =============================================================================
// SEO (react-helmet-async)
// =============================================================================

/**
 * @typedef {Object} SEOWrapperProps
 * @property {string} title - The title for the document.
 * @property {string} description - The description meta tag content.
 * @property {string} [canonical] - The canonical URL for the page.
 */
interface SEOWrapperProps {
    title: string;
    description: string;
    canonical?: string;
}

/**
 * @function SEOWrapper
 * @param {SEOWrapperProps} props - Props for SEO metadata.
 * @returns {JSX.Element} A fragment containing `Helmet` for SEO.
 * @description A component to manage SEO metadata for each "page" of the application.
 */
export const SEOWrapper: React.FC<SEOWrapperProps> = ({ title, description, canonical }) => (
    <Helmet>
        <title>{title} | Code Spell Checker</title>
        <meta name="description" content={description} />
        {canonical && <link rel="canonical" href={canonical} />}
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonical || window.location.href} />
        <meta property="og:title" content={`${title} | Code Spell Checker`} />
        <meta property="og:description" content={description} />
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={canonical || window.location.href} />
        <meta property="twitter:title" content={`${title} | Code Spell Checker`} />
        <meta property="twitter:description" content={description} />
    </Helmet>
);

// =============================================================================
// COMPONENT: MemoizedHighlightedText
// =============================================================================

/**
 * @typedef {Object} HighlightedTextProps
 * @property {string} text - The text content to be spell-checked and highlighted.
 * @property {string[]} typosToHighlight - An array of words considered typos.
 */
interface HighlightedTextProps {
    text: string;
    typosToHighlight: string[];
}

/**
 * @function HighlightedText
 * @param {HighlightedTextProps} props - Props for the HighlightedText component.
 * @returns {JSX.Element} A React Fragment with text where typos are highlighted.
 * @description A memoized functional component that highlights specified typos
 *              within a given text string using a wavy underline.
 */
const HighlightedText: React.FC<HighlightedTextProps> = React.memo(({ text, typosToHighlight }) => {
    // Generate a regex from the list of typos.
    // Ensure the regex is updated only when typosToHighlight changes.
    const typoRegex = useMemo(() => {
        if (typosToHighlight.length === 0) {
            return null; // No typos to highlight
        }
        // Escape special characters in typo words for regex, then join.
        const escapedTypos = typosToHighlight.map(typo => typo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        return new RegExp(`\\b(${escapedTypos.join('|')})\\b`, 'gi');
    }, [typosToHighlight]);

    const parts = useMemo(() => {
        if (!typoRegex || !text) {
            return [text]; // No regex or empty text, return original text
        }

        const result: (string | JSX.Element)[] = [];
        let lastIndex = 0;
        let match;

        // Use a loop with exec to correctly handle global regex matches
        while ((match = typoRegex.exec(text)) !== null) {
            const matchedWord = match[0];
            const startIndex = match.index;
            const endIndex = typoRegex.lastIndex; // lastIndex is updated by exec

            // Add the text before the match
            if (startIndex > lastIndex) {
                result.push(text.substring(lastIndex, startIndex));
            }

            // Add the highlighted match
            result.push(
                <span key={startIndex} className="underline decoration-red-500 decoration-wavy" aria-label={`Typo: ${matchedWord}`}>
                    {matchedWord}
                </span>
            );

            lastIndex = endIndex;
        }

        // Add any remaining text after the last match
        if (lastIndex < text.length) {
            result.push(text.substring(lastIndex));
        }

        return result;
    }, [text, typoRegex]);

    return <>{parts}</>;
});

HighlightedText.displayName = 'HighlightedText';

// =============================================================================
// COMPONENT: SpellCheckerSettingsPanel
// =============================================================================

/**
 * @function SpellCheckerSettingsPanel
 * @returns {JSX.Element} The settings panel component.
 * @description A panel for managing spell checker settings, allowing users to
 *              add custom typos to be highlighted.
 */
const SpellCheckerSettingsPanel: React.FC = () => {
    const { customTypos, addCustomTypo, isLoadingTypos, typoFetchError } = useSpellCheckerSettings();
    const [newTypo, setNewTypo] = useState<string>('');
    const [statusMessage, setStatusMessage] = useState<string>('');

    const handleAddTypo = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (newTypo.trim()) {
            addCustomTypo(newTypo);
            setNewTypo('');
            setStatusMessage(`'${newTypo}' added to custom typos.`);
            setTimeout(() => setStatusMessage(''), 3000); // Clear message after 3 seconds
        }
    }, [newTypo, addCustomTypo]);

    const allWords = useMemo(() => customTypos.map(t => t.word), [customTypos]);

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-slate-800 rounded-lg shadow-xl h-full flex flex-col">
            <SEOWrapper
                title="Settings"
                description="Manage custom spell checker settings and add new typos."
                canonical={`${window.location.origin}/settings`}
            />
            <h2 className="text-2xl font-bold text-slate-100 mb-4 flex items-center">
                <BeakerIcon className="w-6 h-6 mr-2" />
                Spell Checker Settings
            </h2>
            <p className="text-slate-400 mb-6">Customize your spell checker by adding unique typos to highlight.</p>

            <section className="mb-8">
                <h3 className="text-xl font-semibold text-slate-200 mb-3">Add Custom Typo</h3>
                <form onSubmit={handleAddTypo} className="flex flex-col sm:flex-row gap-4">
                    <input
                        type="text"
                        value={newTypo}
                        onChange={(e) => setNewTypo(e.target.value)}
                        placeholder="e.g., 'funtion', 'componnet'"
                        className="flex-grow p-3 bg-slate-700 text-slate-100 border border-slate-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                        aria-label="New custom typo word"
                        required
                    />
                    <button
                        type="submit"
                        className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!newTypo.trim()}
                        aria-live="polite"
                    >
                        Add Typo
                    </button>
                </form>
                {statusMessage && (
                    <p className="mt-2 text-green-400 text-sm" aria-live="polite">{statusMessage}</p>
                )}
            </section>

            <section className="flex-grow">
                <h3 className="text-xl font-semibold text-slate-200 mb-3">Current Typos</h3>
                {isLoadingTypos ? (
                    <p className="text-cyan-400" aria-live="polite">Loading custom typos...</p>
                ) : typoFetchError ? (
                    <p className="text-red-500" aria-live="assertive">Error: {typoFetchError}</p>
                ) : (
                    <div className="bg-slate-700 p-4 rounded-md overflow-y-auto max-h-64 sm:max-h-96">
                        {allWords.length === 0 ? (
                            <p className="text-slate-400">No custom typos added yet. Start adding some!</p>
                        ) : (
                            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-slate-200">
                                {allWords.map((typo, index) => (
                                    <li key={typo + index} className="bg-slate-600 p-2 rounded-sm text-sm flex items-center">
                                        <span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-2" aria-hidden="true"></span>
                                        {typo}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </section>
            <nav className="mt-6 flex justify-end">
                <Link to="/" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                    &larr; Back to Spell Checker
                </Link>
            </nav>
        </div>
    );
};

// =============================================================================
// COMPONENT: CodeSpellCheckerMain
// This is the core functionality, formerly "CodeSpellChecker"
// =============================================================================

/**
 * @function CodeSpellCheckerMain
 * @returns {JSX.Element} The main code spell checker UI component.
 * @description The primary user interface for the code spell checker, allowing
 *              users to input code and see real-time typo highlights.
 */
const CodeSpellCheckerMain: React.FC = () => {
    const { customTypos, isLoadingTypos, typoFetchError } = useSpellCheckerSettings();
    const [code, setCode] = useState<string>(
        'funtion myFunction() {\n  consle.log("Hello World");\n  const myVarable = docment.getElementById("root");\n  // This is a React componnet\n  // Aplication logic might also have interfaace issues.\n}'
    );

    const typosToHighlight = useMemo(() => {
        // Combine static and custom typos, ensuring uniqueness and converting to strings.
        const staticTypos = ['funtion', 'consle', 'varable', 'docment', 'componnet'];
        const allTypos = new Set([...staticTypos, ...customTypos.map(t => t.word)]);
        return Array.from(allTypos);
    }, [customTypos]);

    const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCode(e.target.value);
    }, []);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 bg-slate-900 rounded-lg shadow-xl">
            <SEOWrapper
                title="Code Spell Checker"
                description="Simulate a real-time spell checker for code, highlighting common typos."
                canonical={window.location.origin}
            />
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <BeakerIcon className="w-8 h-8 mr-3" />
                    <span className="ml-3">Code Spell Checker (Simulation)</span>
                </h1>
                <p className="text-slate-400 mt-1">A simulation of a spell checker that finds common typos in code. Try typing 'funtion' or 'consle'!</p>
            </header>

            {isLoadingTypos && (
                <div className="mb-4 p-3 bg-cyan-900 text-cyan-200 rounded-md" role="status" aria-live="polite">
                    <p>Loading spell checker configurations...</p>
                </div>
            )}
            {typoFetchError && (
                <div className="mb-4 p-3 bg-red-900 text-red-200 rounded-md" role="alert" aria-live="assertive">
                    <p>Error loading configurations: {typoFetchError}</p>
                    <p className="text-sm">Using default typo list.</p>
                </div>
            )}

            <div className="relative flex-grow font-mono text-sm bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
                <label htmlFor="code-input" className="sr-only">Enter your code here</label>
                <textarea
                    id="code-input"
                    value={code}
                    onChange={handleCodeChange}
                    className="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-cyan-400 resize-none z-10 font-mono text-sm leading-relaxed"
                    spellCheck="false"
                    autoCapitalize="off"
                    autoCorrect="off"
                    aria-describedby="spell-checker-instructions"
                />
                <pre
                    className="absolute inset-0 w-full h-full p-4 pointer-events-none whitespace-pre-wrap text-slate-200 font-mono text-sm leading-relaxed"
                    aria-hidden="true"
                    id="spell-checker-output"
                >
                    <HighlightedText text={code} typosToHighlight={typosToHighlight} />
                </pre>
            </div>
            <p id="spell-checker-instructions" className="sr-only">
                Type your code in the text area above. Common typos will be highlighted with a red wavy underline.
            </p>
            <nav className="mt-6 flex justify-end">
                <Link to="/settings" className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-md transition-colors font-medium">
                    Manage Settings
                </Link>
            </nav>
        </div>
    );
};

// =============================================================================
// APP ROOT COMPONENT
// This component acts as the main entry point for the entire application.
// =============================================================================

/**
 * @function App
 * @returns {JSX.Element} The root component of the application.
 * @description This is the main application component that orchestrates routing,
 *              error handling, context providers, and renders the primary UI.
 */
export const App: React.FC = () => {
    const location = useLocation();

    // Use a key on Routes to force re-render/reset components when location changes,
    // useful for demonstration in a single-file context or complex route transitions.
    // For most cases, it's not strictly necessary.
    const routeKey = location.pathname;

    return (
        <Fragment>
            <HelmetProvider>
                <ErrorBoundary fallback={<p className="text-red-500 m-8">Failed to render the application. Please try again later.</p>}>
                    <SpellCheckerSettingsProvider>
                        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-8 lg:p-12">
                            <Suspense
                                fallback={
                                    <div className="flex justify-center items-center min-h-[calc(100vh-64px)] text-cyan-400 text-xl" aria-live="polite">
                                        Loading Application...
                                    </div>
                                }
                            >
                                <div className="max-w-4xl mx-auto min-h-[calc(100vh-64px)] bg-slate-900 rounded-lg shadow-2xl flex flex-col">
                                    <Routes key={routeKey}>
                                        <Route path="/" element={<CodeSpellCheckerMain />} />
                                        <Route path="/settings" element={<SpellCheckerSettingsPanel />} />
                                        {/* Add more routes here as the app expands */}
                                        <Route path="*" element={
                                            <div className="p-8 text-center text-slate-300">
                                                <h2 className="text-3xl font-bold mb-4">404 - Page Not Found</h2>
                                                <p className="mb-6">The page you are looking for does not exist.</p>
                                                <Link to="/" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                                                    Go to Home
                                                </Link>
                                            </div>
                                        } />
                                    </Routes>
                                </div>
                            </Suspense>
                        </div>
                    </SpellCheckerSettingsProvider>
                </ErrorBoundary>
            </HelmetProvider>
        </Fragment>
    );
};

// The original file exports CodeSpellChecker.
// To align with "app.tsx" goals, we now export App which wraps everything.
// If this file were truly app.tsx, this is how it would typically be structured.
// For the purpose of the instruction "Return ONLY the complete, updated code for the file",
// and assuming this file *is* the `app.tsx` equivalent, `App` is the main export.
// The file's name being `CodeSpellChecker.tsx` is a constraint, not an instruction to keep the original export name.
// Thus, renaming the top-level export to `App` best fits the spirit of the prompt.
// If this file was meant to be a *module* within a larger `app.tsx`,
// then `CodeSpellCheckerMain` would be exported. Given the instruction to combine everything
// *into a single app.tsx* and *return the content of the file*, the assumption is
// this file effectively *becomes* app.tsx, and `App` is its root.

// No need for `export { CodeSpellCheckerMain as CodeSpellChecker };` if `App` is the primary export.
// We keep the `App` export as the main entry point for the conceptual single-file app.
```