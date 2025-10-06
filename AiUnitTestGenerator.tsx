// Copyright James Burvel Oâ€™Callaghan III
// President Citibank Demo Business Inc.

/**
 * @file app.tsx
 * @description
 * This file consolidates the AI Unit Test Generator functionality into a single, polished,
 * enterprise-grade React component. It demonstrates best practices including:
 * -   **TypeScript**: Strongly typed props, state, and functions.
 * -   **State Management**: Utilizes React Context API for managing application state
 *     (code, tests, loading, errors, settings).
 * -   **Error Handling**: Incorporates a robust Error Boundary for UI resilience.
 * -   **Loading States**: Clear visual feedback during asynchronous operations.
 * -   **Accessibility (A11y)**: Semantic HTML, ARIA attributes for enhanced user experience.
 * -   **Performance Optimization**: `React.memo` and `useCallback` to prevent unnecessary re-renders.
 * -   **Responsive Styling**: Tailwind CSS classes provide responsive design out-of-the-box.
 * -   **Documentation**: Comprehensive JSDoc comments for clarity and maintainability.
 * -   **New Features**: Added options for test framework, language, and actions like copying tests.
 *
 * This component acts as a self-contained application for generating unit tests using AI,
 * demonstrating how a complex feature can be built following high-quality engineering standards.
 */

import React, { useState, useCallback, createContext, useContext, useEffect, useMemo } from 'react';
import { generateUnitTests } from '../../services/geminiService.ts'; // Preserve existing import
import { BeakerIcon } from '../icons/FeatureIcons.tsx'; // Preserve existing import
import { LoadingSpinner } from './shared/LoadingSpinner.tsx'; // Preserve existing import
import { marked } from 'marked'; // Preserve existing import

// Component: ErrorBoundary
/**
 * @typedef {object} ErrorBoundaryProps
 * @property {React.ReactNode} children - The child components to render within the error boundary.
 * @property {string} [fallbackMessage] - An optional custom message to display on error.
 */
interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallbackMessage?: string;
}

/**
 * @typedef {object} ErrorBoundaryState
 * @property {boolean} hasError - Indicates if an error has occurred.
 * @property {Error | null} error - The error object if an error occurred.
 * @property {React.ErrorInfo | null} errorInfo - The error info object from React.
 */
interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

/**
 * @class ErrorBoundary
 * @extends {React.Component<ErrorBoundaryProps, ErrorBoundaryState>}
 * @description
 * A React Error Boundary component that catches JavaScript errors anywhere in its child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 * This prevents the entire application from crashing.
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
     * @returns {ErrorBoundaryState} An object to update the state.
     * @description
     * This static method is called after an error has been thrown by a descendant component.
     * It updates the state so the next render will show the fallback UI.
     */
    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error: error, errorInfo: null };
    }

    /**
     * @method componentDidCatch
     * @param {Error} error - The error that was thrown.
     * @param {React.ErrorInfo} errorInfo - An object with a `componentStack` key
     *                                      containing information about which component
     *                                      threw the error.
     * @description
     * This method is called after an error has been thrown by a descendant component.
     * It's used for logging error information.
     */
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        // You can also log the error to an error reporting service
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render(): React.ReactNode {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="flex flex-col items-center justify-center h-full p-4 bg-red-900/20 text-red-300 rounded-lg border border-red-700">
                    <h2 className="text-xl font-bold mb-2">Oops! Something went wrong.</h2>
                    <p className="text-center mb-4">
                        {this.props.fallbackMessage || "We're sorry, an unexpected error occurred. Please try again."}
                    </p>
                    {this.state.error && (
                        <details className="text-sm cursor-pointer mt-2 p-2 bg-red-900/30 rounded-md">
                            <summary className="font-semibold">Error Details</summary>
                            <pre className="whitespace-pre-wrap break-all text-xs max-h-48 overflow-auto mt-2">
                                {this.state.error.toString()}
                                {this.state.errorInfo?.componentStack && `\n\n${this.state.errorInfo.componentStack}`}
                            </pre>
                        </details>
                    )}
                    <button
                        onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

// Global Types, Enums & Interfaces
/**
 * @enum {string} TestFramework
 * @description
 * Defines the supported unit test frameworks for generation.
 */
export enum TestFramework {
    JEST = 'Jest',
    MOCHA = 'Mocha',
    VITEST = 'Vitest',
    RTL = 'React Testing Library (RTL)', // Added for React components
}

/**
 * @enum {string} TestLanguage
 * @description
 * Defines the supported programming languages for the generated unit tests.
 */
export enum TestLanguage {
    TYPESCRIPT = 'TypeScript',
    JAVASCRIPT = 'JavaScript'
}

/**
 * @interface UnitTestGeneratorContextType
 * @description
 * Defines the shape of the context object for the AI Unit Test Generator.
 */
export interface UnitTestGeneratorContextType {
    code: string;
    setCode: (code: string) => void;
    tests: string;
    setTests: (tests: string) => void;
    isLoading: boolean;
    error: string | null;
    setError: (error: string | null) => void;
    testFramework: TestFramework;
    setTestFramework: (framework: TestFramework) => void;
    testLanguage: TestLanguage;
    setTestLanguage: (language: TestLanguage) => void;
    generateTests: () => Promise<void>;
    copyTestsToClipboard: () => Promise<void>;
    clearAll: () => void;
    cleanMarkdown: (md: string) => string;
}

// Component: UnitTestGeneratorContext
/**
 * @constant UnitTestGeneratorContext
 * @type {React.Context<UnitTestGeneratorContextType | undefined>}
 * @description
 * React Context for the AI Unit Test Generator state management.
 */
const UnitTestGeneratorContext = createContext<UnitTestGeneratorContextType | undefined>(undefined);

/**
 * @hook useUnitTestGenerator
 * @returns {UnitTestGeneratorContextType} The context object for the AI Unit Test Generator.
 * @throws {Error} If used outside of a `UnitTestGeneratorProvider`.
 * @description
 * A custom hook to conveniently access the `UnitTestGeneratorContext`.
 */
export const useUnitTestGenerator = (): UnitTestGeneratorContextType => {
    const context = useContext(UnitTestGeneratorContext);
    if (context === undefined) {
        throw new Error('useUnitTestGenerator must be used within a UnitTestGeneratorProvider');
    }
    return context;
};

/**
 * @typedef {object} UnitTestGeneratorProviderProps
 * @property {React.ReactNode} children - The child components that will consume the context.
 */
interface UnitTestGeneratorProviderProps {
    children: React.ReactNode;
}

// Component: UnitTestGeneratorProvider
/**
 * @function UnitTestGeneratorProvider
 * @param {UnitTestGeneratorProviderProps} props - The component props.
 * @returns {JSX.Element} The provider component that wraps its children with the context.
 * @description
 * Provides the state and functions for the AI Unit Test Generator to its children components.
 * It encapsulates all the core logic, state management, and interaction with the `geminiService`.
 */
export const UnitTestGeneratorProvider: React.FC<UnitTestGeneratorProviderProps> = React.memo(({ children }) => {
    const exampleCode = `export function calculateTotalPrice(items: { price: number; quantity: number }[], taxRate: number): number {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return subtotal * (1 + taxRate);
}`;
    const [code, setCode] = useState<string>(exampleCode);
    const [tests, setTests] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [testFramework, setTestFramework] = useState<TestFramework>(TestFramework.JEST);
    const [testLanguage, setTestLanguage] = useState<TestLanguage>(TestLanguage.TYPESCRIPT);

    /**
     * @function cleanMarkdown
     * @param {string} md - The markdown string to clean.
     * @returns {string} The cleaned string, with markdown code block fences removed.
     * @description
     * Removes the leading and trailing markdown code block fences (```) from a string.
     */
    const cleanMarkdown = useCallback((md: string): string => md.replace(/^```(?:\w+\n)?/, '').replace(/```$/, ''), []);

    /**
     * @function generateTests
     * @returns {Promise<void>} A promise that resolves when tests are generated or rejects on error.
     * @description
     * Handles the logic for generating unit tests by calling the `geminiService`.
     * Manages loading, error states, and updates the `tests` state.
     */
    const generateTests = useCallback(async (): Promise<void> => {
        if (!code.trim()) {
            setError('Please enter some code to generate tests for.');
            setTests('');
            return;
        }
        setIsLoading(true);
        setError(null);
        setTests('');
        try {
            // Construct a prompt with framework and language preferences
            const prompt = `Generate unit tests for the following ${testLanguage} code. Focus on using the ${testFramework} framework.
            
            Code:
            \`\`\`${testLanguage.toLowerCase()}
            ${code}
            \`\`\`
            `;
            const result = await generateUnitTests(prompt);
            setTests(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate tests: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    }, [code, testFramework, testLanguage]);

    /**
     * @function copyTestsToClipboard
     * @returns {Promise<void>} A promise that resolves when tests are copied.
     * @description
     * Copies the generated tests to the user's clipboard.
     */
    const copyTestsToClipboard = useCallback(async (): Promise<void> => {
        if (tests) {
            try {
                // Clean markdown fences before copying
                const textToCopy = cleanMarkdown(tests);
                await navigator.clipboard.writeText(textToCopy);
                alert('Tests copied to clipboard!'); // Simple feedback
            } catch (err) {
                console.error('Failed to copy tests:', err);
                setError('Failed to copy tests to clipboard.');
            }
        }
    }, [tests, cleanMarkdown]);

    /**
     * @function clearAll
     * @description
     * Clears all input fields, generated tests, and error messages.
     */
    const clearAll = useCallback((): void => {
        setCode('');
        setTests('');
        setError(null);
        setIsLoading(false);
        setTestFramework(TestFramework.JEST);
        setTestLanguage(TestLanguage.TYPESCRIPT);
    }, []);

    // Memoize the context value to prevent unnecessary re-renders of consumers
    const contextValue = useMemo(() => ({
        code,
        setCode,
        tests,
        setTests,
        isLoading,
        error,
        setError,
        testFramework,
        setTestFramework,
        testLanguage,
        setTestLanguage,
        generateTests,
        copyTestsToClipboard,
        clearAll,
        cleanMarkdown,
    }), [
        code, setCode, tests, setTests, isLoading, error, setError,
        testFramework, setTestFramework, testLanguage, setTestLanguage,
        generateTests, copyTestsToClipboard, clearAll, cleanMarkdown
    ]);

    return (
        <UnitTestGeneratorContext.Provider value={contextValue}>
            {children}
        </UnitTestGeneratorContext.Provider>
    );
});


// Component: AiUnitTestGenerator (Main Application Component)
/**
 * @function AiUnitTestGenerator
 * @returns {JSX.Element} The main AI Unit Test Generator application component.
 * @description
 * This is the root component for the AI Unit Test Generator application.
 * It orchestrates the UI, interacts with the `UnitTestGeneratorContext` for state,
 * and displays the input, output, and controls for test generation.
 * The component is wrapped with `React.memo` for performance optimization.
 */
export const AiUnitTestGenerator: React.FC = React.memo(() => {
    const {
        code, setCode, tests, isLoading, error,
        testFramework, setTestFramework, testLanguage, setTestLanguage,
        generateTests, copyTestsToClipboard, clearAll, cleanMarkdown
    } = useUnitTestGenerator();

    // Effect to update the example code based on selected language
    useEffect(() => {
        if (code === `export function calculateTotalPrice(items, taxRate) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return subtotal * (1 + taxRate);
}` || code === `export function calculateTotalPrice(items: { price: number; quantity: number }[], taxRate: number): number {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return subtotal * (1 + taxRate);
}`) {
            if (testLanguage === TestLanguage.TYPESCRIPT) {
                setCode(`export function calculateTotalPrice(items: { price: number; quantity: number }[], taxRate: number): number {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return subtotal * (1 + taxRate);
}`);
            } else {
                setCode(`export function calculateTotalPrice(items, taxRate) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return subtotal * (1 + taxRate);
}`);
            }
        }
    }, [testLanguage]); // Only re-run if testLanguage changes

    return (
        <ErrorBoundary fallbackMessage="Failed to render the test generator.">
            <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 bg-slate-950 text-slate-100">
                <header className="mb-6 border-b border-slate-700 pb-4">
                    <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                        <BeakerIcon className="w-8 h-8 text-cyan-400" aria-hidden="true" />
                        <span className="ml-3">AI Unit Test Generator</span>
                    </h1>
                    <p className="text-slate-400 mt-1">Provide a function or component and let AI write the tests.</p>
                </header>

                {/* Settings Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label htmlFor="test-framework" className="block text-sm font-medium text-slate-400 mb-1">Test Framework</label>
                        <select
                            id="test-framework"
                            value={testFramework}
                            onChange={(e) => setTestFramework(e.target.value as TestFramework)}
                            className="w-full p-2 bg-slate-800 border border-slate-700 rounded-md text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                            aria-label="Select test framework"
                        >
                            {Object.values(TestFramework).map((framework) => (
                                <option key={framework} value={framework}>{framework}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="code-language" className="block text-sm font-medium text-slate-400 mb-1">Code Language</label>
                        <select
                            id="code-language"
                            value={testLanguage}
                            onChange={(e) => setTestLanguage(e.target.value as TestLanguage)}
                            className="w-full p-2 bg-slate-800 border border-slate-700 rounded-md text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                            aria-label="Select code language"
                        >
                            {Object.values(TestLanguage).map((lang) => (
                                <option key={lang} value={lang}>{lang}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-hidden">
                    {/* Source Code Input */}
                    <div className="flex flex-col h-full">
                        <label htmlFor="code-input" className="text-sm font-medium text-slate-400 mb-2 sr-only">Source Code</label>
                        <textarea
                            id="code-input"
                            value={code}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCode(e.target.value)}
                            placeholder="Paste your source code here..."
                            className="flex-grow p-4 bg-slate-900 border border-slate-700 rounded-md resize-none font-mono text-sm text-cyan-300 focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-slate-500"
                            aria-label="Source code input"
                            aria-describedby="code-input-help"
                        />
                        <p id="code-input-help" className="sr-only">Enter the source code you want to generate unit tests for.</p>

                        <div className="mt-4 flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={generateTests}
                                disabled={isLoading || !code.trim()}
                                className="flex-grow flex items-center justify-center px-6 py-3 bg-cyan-600 text-slate-900 font-bold rounded-md hover:bg-cyan-500 transition-colors disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-base"
                                aria-live="polite"
                                aria-busy={isLoading}
                            >
                                {isLoading ? <LoadingSpinner /> : 'Generate Unit Tests'}
                            </button>
                            <button
                                onClick={clearAll}
                                className="flex-grow flex items-center justify-center px-6 py-3 bg-slate-700 text-slate-200 font-bold rounded-md hover:bg-slate-600 transition-colors text-base"
                                aria-label="Clear all input and generated tests"
                            >
                                Clear All
                            </button>
                        </div>
                    </div>

                    {/* Generated Tests Output */}
                    <div className="flex flex-col h-full">
                        <label className="text-sm font-medium text-slate-400 mb-2 sr-only">Generated Tests Output</label>
                        <div
                            className="flex-grow p-1 bg-slate-800/50 border border-slate-700/50 rounded-md overflow-y-auto relative"
                            role="region"
                            aria-live="polite"
                            aria-atomic="true"
                            aria-label="Generated tests output area"
                        >
                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80 z-10">
                                    <LoadingSpinner message="Generating tests..." />
                                </div>
                            )}
                            {error && <p className="p-4 text-red-400 bg-red-900/20 rounded-md m-2">{error}</p>}
                            {tests && !isLoading && (
                                <>
                                    <div
                                        className="prose prose-sm prose-invert max-w-none prose-pre:bg-transparent prose-pre:p-4 prose-pre:m-0 prose-code:text-cyan-300"
                                        dangerouslySetInnerHTML={{ __html: marked(tests) }}
                                        role="textbox"
                                        aria-readonly="true"
                                        aria-label="Display of generated unit tests"
                                    />
                                    <button
                                        onClick={copyTestsToClipboard}
                                        className="absolute top-2 right-2 p-2 bg-slate-700 text-slate-200 rounded-md hover:bg-slate-600 transition-colors text-sm"
                                        aria-label="Copy generated tests to clipboard"
                                        title="Copy tests to clipboard"
                                    >
                                        Copy Tests
                                    </button>
                                </>
                            )}
                            {!isLoading && !tests && !error && (
                                <div className="text-slate-500 h-full flex items-center justify-center p-4">
                                    The generated tests will appear here.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
});

// Root application component wrapper (if this were app.tsx)
/**
 * @function App
 * @returns {JSX.Element} The root application component.
 * @description
 * This component acts as the entry point for the application, providing
 * the `UnitTestGeneratorProvider` to the `AiUnitTestGenerator` component.
 * In a multi-page application, this would typically include routing.
 * For this exercise, it demonstrates the primary component wrapped with its context.
 */
/*
export const App: React.FC = () => {
    return (
        <UnitTestGeneratorProvider>
            <AiUnitTestGenerator />
        </UnitTestGeneratorProvider>
    );
};
*/
// The original instruction was to enhance AiUnitTestGenerator.tsx directly,
// so the provider is added to wrap the component in the final usage,
// not necessarily as a new `App` export within this file itself.
// However, I've kept the provider as an export to be used by any consuming App.

// To use this enhanced component, you would typically do:
// import { AiUnitTestGenerator, UnitTestGeneratorProvider } from './AiUnitTestGenerator.tsx';
//
// function App() {
//   return (
//     <UnitTestGeneratorProvider>
//       <AiUnitTestGenerator />
//     </UnitTestGeneratorProvider>
//   );
// }
// export default App;
// Or directly wrap in your main index.tsx render:
// ReactDOM.render(
//   <React.StrictMode>
//     <UnitTestGeneratorProvider>
//       <AiUnitTestGenerator />
//     </UnitTestGeneratorProvider>
//   </React.StrictMode>,
//   document.getElementById('root')
// );