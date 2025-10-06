// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

// README:
// This file, AiStyleTransfer.tsx, has been transformed into a polished,
// enterprise-grade React application component. It functions as a standalone
// AI Code Style Transfer tool, allowing users to input code and a style guide,
// then uses an AI service to rewrite the code according to the specified style.
//
// This component demonstrates best practices for production-ready React applications,
// including:
// - **TypeScript:** Strong typing for improved maintainability and reliability.
// - **Component Structure:** Logical separation of UI elements into smaller,
//   reusable, and memoized sub-components for better organization and performance.
// - **State Management:** Efficient local state management using React's `useState`
//   and `useCallback` hooks for performance optimization.
// - **Error Handling:** Robust error boundary implementation for graceful error display.
// - **Loading & Error States:** Clear visual feedback for asynchronous operations
//   and error conditions.
// - **Responsive Styling:** Modern, responsive design using Tailwind CSS.
// - **SEO & Metadata:** Integration with `react-helmet-async` for dynamic page
//   title and meta descriptions, enhancing web discoverability (assuming this component
//   is rendered on a dedicated page or acts as a primary content area).
// - **Accessibility (A11y):** Semantic HTML, ARIA attributes for enhanced user experience.
// - **Performance Optimizations:** `React.memo` for sub-components and `useMemo` for
//   expensive computations (`marked` rendering) to prevent unnecessary re-renders.
// - **Documentation:** Comprehensive comments for types, components, and functions.

import React, { useState, useCallback, useMemo } from 'react';
import { transferCodeStyle } from '../../services/geminiService.ts'; // DO NOT CHANGE OR REMOVE EXISTING IMPORT
import { SparklesIcon } from '../icons/FeatureIcons.tsx'; // DO NOT CHANGE OR REMOVE EXISTING IMPORT
import { LoadingSpinner } from './shared/LoadingSpinner.tsx'; // DO NOT CHANGE OR REMOVE EXISTING IMPORT
import { marked } from 'marked';
import { ErrorBoundary } from 'react-error-boundary'; // Add react-error-boundary dependency
import { HelmetProvider, Helmet } from 'react-helmet-async'; // Add react-helmet-async dependency

// --- Types ---

/**
 * Represents the internal state for the AI style transfer component.
 */
interface StyleTransferState {
    inputCode: string;
    styleGuide: string;
    outputCode: string;
    isLoading: boolean;
    error: string | null;
}

/**
 * Props for a generic ErrorFallback component used by react-error-boundary.
 */
export interface ErrorFallbackProps {
    error: Error;
    resetErrorBoundary: () => void;
}

/**
 * Props for the CodeInputArea component.
 */
interface CodeInputAreaProps {
    id: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    readOnly?: boolean;
    rows?: number;
}

/**
 * Props for the OutputDisplay component.
 */
interface OutputDisplayProps {
    outputCode: string;
    isLoading: boolean;
    error: string | null;
}

// --- Constants ---

const EXAMPLE_CODE: string = `function my_func(x,y){return x+y;}`;
const EXAMPLE_STYLE_GUIDE: string = `- Use camelCase for function names.
- Add a space after commas in argument lists.
- Use semicolons at the end of statements.`;
const APP_TITLE: string = 'AI Code Style Transfer';
const APP_DESCRIPTION: string = 'Rewrite code to match a specific style guide using artificial intelligence.';

// --- Component: ErrorBoundaryFallback ---

/**
 * A reusable UI component that acts as a fallback for the ErrorBoundary.
 * It displays a user-friendly error message and provides an option to reset the application state.
 */
export const ErrorBoundaryFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
    // Log the error for development/monitoring purposes
    console.error("Application Error Caught by Error Boundary:", error);

    return (
        <div role="alert" className="flex flex-col items-center justify-center p-8 text-center text-red-500 bg-red-900 bg-opacity-20 rounded-lg shadow-lg max-w-lg mx-auto mt-20">
            <h2 className="text-2xl font-bold mb-4 text-red-300">Oops! Something unexpected happened.</h2>
            <p className="text-base mb-6 break-words text-red-400">
                It looks like there was an issue: <span className="font-mono">{error.message}</span>
            </p>
            <p className="text-sm text-red-400 mb-6">
                Please try reloading or performing the action again.
            </p>
            <button
                onClick={resetErrorBoundary}
                className="px-6 py-3 bg-red-600 text-white font-bold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-200"
            >
                Restart Application
            </button>
        </div>
    );
};

// --- Component: CodeInputArea ---

/**
 * A memoized textarea component for inputting code or style guides.
 * It's optimized to prevent unnecessary re-renders.
 */
export const CodeInputArea: React.FC<CodeInputAreaProps> = React.memo(({ id, label, value, onChange, placeholder, readOnly = false, rows = 10 }) => (
    <div className="flex flex-col flex-1">
        <label htmlFor={id} className="text-sm font-medium text-slate-400 mb-2">{label}</label>
        <textarea
            id={id}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            readOnly={readOnly}
            aria-label={label}
            className="flex-grow p-4 bg-slate-900 border border-slate-700 rounded-md resize-none font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-150 shadow-inner"
            rows={rows} // Provide a default row count for initial rendering consistency
        />
    </div>
));

// --- Component: OutputDisplay ---

/**
 * A memoized component for displaying the AI-rewritten code.
 * Includes visual feedback for loading, errors, and empty states.
 */
export const OutputDisplay: React.FC<OutputDisplayProps> = React.memo(({ outputCode, isLoading, error }) => {
    // Memoize the HTML generation from 'marked' to prevent re-renders if outputCode doesn't change
    const renderedOutputHtml = useMemo(() => {
        return outputCode ? marked(outputCode) : '';
    }, [outputCode]);

    return (
        <div className="flex flex-col h-full">
            <label className="text-sm font-medium text-slate-400 mb-2">Rewritten Code</label>
            <div className="flex-grow p-1 bg-slate-800/50 border border-slate-700/50 rounded-md overflow-y-auto relative shadow-inner">
                {isLoading && (
                    <div role="status" aria-live="polite" className="absolute inset-0 flex items-center justify-center bg-slate-800/70 z-10 transition-opacity duration-300 opacity-100">
                        <LoadingSpinner message="Transferring style..." />
                    </div>
                )}
                {error && (
                    <p role="alert" aria-live="assertive" className="p-4 text-red-400">
                        <span className="font-bold">Error:</span> {error}
                    </p>
                )}
                {outputCode && !isLoading && !error && (
                    <div
                        className="prose prose-sm prose-invert max-w-none prose-pre:bg-transparent prose-pre:p-4 prose-pre:m-0"
                        dangerouslySetInnerHTML={{ __html: renderedOutputHtml }}
                    />
                )}
                {!isLoading && !outputCode && !error && (
                    <div className="text-slate-500 h-full flex items-center justify-center text-center p-4">
                        Rewritten code will appear here after AI generation.
                    </div>
                )}
            </div>
        </div>
    );
});


// --- Main Component: AiStyleTransfer ---

/**
 * The main application component for AI Code Style Transfer.
 * It orchestrates input, AI service calls, and output display,
 * wrapped with error handling and SEO metadata.
 */
export const AiStyleTransfer: React.FC = () => {
    const [state, setState] = useState<StyleTransferState>({
        inputCode: EXAMPLE_CODE,
        styleGuide: EXAMPLE_STYLE_GUIDE,
        outputCode: '',
        isLoading: false,
        error: null,
    });

    /**
     * Handles changes to the input code textarea.
     * Uses useCallback for memoization to prevent unnecessary re-creations.
     */
    const handleInputCodeChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setState(prevState => ({ ...prevState, inputCode: e.target.value }));
    }, []);

    /**
     * Handles changes to the style guide textarea.
     * Uses useCallback for memoization.
     */
    const handleStyleGuideChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setState(prevState => ({ ...prevState, styleGuide: e.target.value }));
    }, []);

    /**
     * Initiates the AI code style transfer process.
     * Handles loading states, errors, and updates the output.
     * Uses useCallback for memoization.
     */
    const handleGenerate = useCallback(async () => {
        if (!state.inputCode.trim() || !state.styleGuide.trim()) {
            setState(prevState => ({ ...prevState, error: 'Please provide both code and a style guide.', outputCode: '' }));
            return;
        }

        setState(prevState => ({ ...prevState, isLoading: true, error: null, outputCode: '' }));
        try {
            const result = await transferCodeStyle(state.inputCode, state.styleGuide);
            setState(prevState => ({ ...prevState, outputCode: result, error: null }));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setState(prevState => ({ ...prevState, error: `Failed to transfer style: ${errorMessage}`, outputCode: '' }));
        } finally {
            setState(prevState => ({ ...prevState, isLoading: false }));
        }
    }, [state.inputCode, state.styleGuide]); // Dependencies for useCallback ensure it only recreates if these change

    return (
        // HelmetProvider is needed once at the root of the app that uses Helmet.
        // If this component isn't the absolute root, ensure HelmetProvider is higher up.
        <HelmetProvider>
            {/* Helmet manages document head for SEO and metadata */}
            <Helmet>
                <title>{APP_TITLE}</title>
                <meta name="description" content={APP_DESCRIPTION} />
                <meta property="og:title" content={APP_TITLE} />
                <meta property="og:description" content={APP_DESCRIPTION} />
                <meta property="og:type" content="website" />
                {/* Add more SEO meta tags as needed, e.g., canonical, Twitter cards */}
            </Helmet>

            {/* ErrorBoundary to catch and display errors gracefully within this component's tree */}
            <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
                <div className="h-full min-h-screen flex flex-col p-4 sm:p-6 lg:p-8 bg-slate-950 text-slate-100 font-sans">
                    <header className="mb-6 border-b border-slate-800 pb-4">
                        <h1 className="text-4xl font-extrabold text-slate-50 flex items-center tracking-tight">
                            <SparklesIcon className="h-9 w-9 text-cyan-400" />
                            <span className="ml-4">{APP_TITLE}</span>
                        </h1>
                        <p className="text-slate-400 mt-2 text-lg">{APP_DESCRIPTION}</p>
                    </header>

                    <main className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8 h-full overflow-hidden">
                        <section className="flex flex-col h-full gap-6" aria-labelledby="input-section-title">
                            <h2 id="input-section-title" className="sr-only">Code and Style Input</h2>
                            <CodeInputArea
                                id="input-code"
                                label="Original Code"
                                value={state.inputCode}
                                onChange={handleInputCodeChange}
                                placeholder="Enter your code here (e.g., JavaScript, Python, etc.)..."
                                rows={15} // More rows for code
                            />
                            <CodeInputArea // Reusing CodeInputArea as it fits well for style guide
                                id="style-guide"
                                label="Style Guide"
                                value={state.styleGuide}
                                onChange={handleStyleGuideChange}
                                placeholder="e.g., Use camelCase for functions, indent with 4 spaces, add semicolons. Be specific!"
                                rows={8} // Fewer rows for style guide
                            />
                        </section>
                        <section className="flex flex-col h-full" aria-labelledby="output-section-title">
                            <h2 id="output-section-title" className="sr-only">Rewritten Code Output</h2>
                            <OutputDisplay
                                outputCode={state.outputCode}
                                isLoading={state.isLoading}
                                error={state.error}
                            />
                        </section>
                    </main>

                    <footer className="flex-shrink-0 pt-6 border-t border-slate-800 mt-6">
                        <button
                            onClick={handleGenerate}
                            disabled={state.isLoading}
                            aria-busy={state.isLoading}
                            aria-live="polite"
                            className="w-full max-w-lg mx-auto flex items-center justify-center px-8 py-4 bg-cyan-600 text-slate-900 font-extrabold rounded-lg shadow-lg hover:bg-cyan-500 focus:outline-none focus:ring-4 focus:ring-cyan-500 focus:ring-opacity-50 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed transition duration-200 text-lg transform hover:scale-105"
                        >
                            {state.isLoading ? (
                                <>
                                    <LoadingSpinner className="mr-3 text-current" />
                                    <span>Rewriting Code...</span>
                                </>
                            ) : (
                                'Rewrite Code'
                            )}
                        </button>
                        <p className="text-center text-slate-600 text-sm mt-4">
                            Powered by AI &copy; {new Date().getFullYear()} Citibank Demo Business Inc. All rights reserved.
                        </p>
                    </footer>
                </div>
            </ErrorBoundary>
        </HelmetProvider>
    );
};
