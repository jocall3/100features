// Copyright James Burvel Oâ€™Callaghan III
// President Citibank Demo Business Inc.

// File: app.tsx
//
// This file represents a core feature of an enterprise-grade React application:
// a Code-to-Flowchart converter. It leverages AI (via Gemini Service) to transform
// source code into visual Mermaid flowcharts, demonstrating best practices in
// component design, state management, error handling, accessibility, and performance
// within a single, self-contained TSX file.
//
// Features:
// - **AI-Powered Conversion**: Integrates with an external `geminiService` to generate Mermaid syntax from code.
// - **Interactive Flowchart Rendering**: Uses the `mermaid` library to render SVG flowcharts dynamically.
// - **Robust Error Handling**: Implements a React Error Boundary for rendering issues and clear error messages for API failures.
// - **Loading States**: Visual feedback during AI processing and flowchart rendering.
// - **Code Examples**: Provides predefined code snippets for quick testing.
// - **Accessibility (A11y)**: Semantic HTML, ARIA attributes for live regions and interactive elements.
// - **Performance Optimization**: `React.memo` for component memoization, `useCallback` for stable function references.
// - **Type Safety**: Comprehensive TypeScript types for props, state, and data structures.
// - **Responsive Design**: Tailwind CSS for a mobile-first, responsive layout.
// - **Download Functionality**: Allows users to download the generated flowchart as an SVG.
// - **Copy Functionality**: Allows users to copy the raw Mermaid code.
// - **Clear Functionality**: Resets the input and output areas.
//
// This component is designed to be highly maintainable and scalable, serving as a template
// for similar interactive AI-powered tools within a larger application.

import React, { useState, useCallback, useEffect, useRef, ErrorInfo } from 'react';
import { generateFlowchart } from '../../services/geminiService';
import { MapIcon } from '../icons/FeatureIcons';
import { LoadingSpinner } from './shared/LoadingSpinner';
import mermaid from 'mermaid';

// --- Global Mermaid Configuration ---
// Configures Mermaid for dark mode and specific theme variables
// to match the application's overall design system.
mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    darkMode: true,
    securityLevel: 'loose',
    themeVariables: {
        background: '#1e293b', // slate-800
        primaryColor: '#334155', // slate-700
        primaryTextColor: '#cbd5e1', // slate-300
        lineColor: '#64748b', // slate-500
        textColor: '#cbd5e1',
        fontFamily: 'Inter, sans-serif',
        primaryBorderColor: '#475569', // slate-600
        secondaryColor: '#475569',
        secondaryTextColor: '#cbd5e1',
        tertiaryColor: '#64748b',
        tertiaryTextColor: '#cbd5e1',
        nodeBorder: '#64748b',
        clusterBkg: '#1e293b',
        clusterBorder: '#475569',
    },
});

// --- Types ---
/**
 * @interface FlowchartResult
 * @description Defines the structure of the data returned by the `generateFlowchart` service.
 */
export interface FlowchartResult {
    mermaidCode: string;
    // Potentially add other fields like `originalPrompt`, `modelUsed`, etc.
}

/**
 * @interface CodeExample
 * @description Defines the structure for a predefined code example.
 */
export interface CodeExample {
    id: string;
    name: string;
    code: string;
}

/**
 * @interface ErrorBoundaryProps
 * @description Props for the ErrorBoundary component.
 */
interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * @interface ErrorBoundaryState
 * @description State for the ErrorBoundary component.
 */
interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

// --- Constants ---
/**
 * @constant EXAMPLE_CODES
 * @description An array of predefined code examples to demonstrate the flowchart generation.
 */
export const EXAMPLE_CODES: CodeExample[] = [
    {
        id: '1',
        name: 'Basic Conditional',
        code: `function checkNumber(num) {
  if (num > 0) {
    return "Positive";
  } else if (num < 0) {
    return "Negative";
  } else {
    return "Zero";
  }
}`,
    },
    {
        id: '2',
        name: 'Simple Loop',
        code: `function countDown(start) {
  let count = start;
  while (count > 0) {
    console.log(count);
    count--;
  }
  return "Done!";
}`,
    },
    {
        id: '3',
        name: 'Async Function',
        code: `async function fetchData(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch:", error);
    return null;
  }
}`,
    },
    {
        id: '4',
        name: 'Complex Logic',
        code: `function calculateDiscount(price, quantity, isMember) {
  let total = price * quantity;
  let discountRate = 0;

  if (quantity > 10) {
    discountRate += 0.1; // 10% off for bulk
  }

  if (isMember) {
    discountRate += 0.05; // 5% off for members
  }

  if (total > 500 && isMember) {
    discountRate += 0.02; // Additional 2% for high-value member purchase
  }

  total -= total * discountRate;
  return total;
}`,
    },
];

// --- Helper Components ---

/**
 * @class ErrorBoundary
 * @description A generic React Error Boundary component to catch UI rendering errors.
 * It provides a fallback UI and logs errors for better debugging.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    public state: ErrorBoundaryState = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    /**
     * @method getDerivedStateFromError
     * @description Updates state so the next render will show the fallback UI.
     */
    public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error, errorInfo: null };
    }

    /**
     * @method componentDidCatch
     * @description Catches errors thrown by children and logs them.
     */
    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
        this.setState({ errorInfo });
        // You can also log error messages to an error reporting service here
        // logErrorToService(error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="p-4 bg-red-900 bg-opacity-30 border border-red-700 rounded-md text-red-300">
                    <h2 className="text-lg font-bold">Oops, something went wrong.</h2>
                    <p className="mt-2 text-sm">
                        There was an error rendering this part of the application. Please try again.
                    </p>
                    {this.state.error && (
                        <details className="mt-2 text-xs">
                            <summary>Error Details</summary>
                            <pre className="whitespace-pre-wrap break-all mt-1 p-2 bg-red-900 rounded">
                                {this.state.error.toString()}
                                {this.state.errorInfo && this.state.errorInfo.componentStack}
                            </pre>
                        </details>
                    )}
                    {this.props.fallback}
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * @component CodeExampleSelector
 * @description A dropdown component to select predefined code examples.
 */
export const CodeExampleSelector: React.FC<{ onSelect: (code: string) => void }> = React.memo(({ onSelect }) => {
    const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedCode = event.target.value;
        if (selectedCode) {
            onSelect(selectedCode);
        }
    };

    return (
        <div className="mb-4">
            <label htmlFor="example-select" className="sr-only">
                Select a code example
            </label>
            <select
                id="example-select"
                onChange={handleSelectChange}
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-md text-sm text-slate-300 focus:ring-cyan-500 focus:border-cyan-500"
                aria-label="Select a code example"
            >
                <option value="">-- Select an example --</option>
                {EXAMPLE_CODES.map((example) => (
                    <option key={example.id} value={example.code}>
                        {example.name}
                    </option>
                ))}
            </select>
        </div>
    );
});

// --- Main Component: CodeToFlowchart ---

/**
 * @component CodeToFlowchart
 * @description The main component for converting source code into a visual flowchart.
 * It integrates AI services, UI rendering, and user interactions.
 */
export const CodeToFlowchart: React.FC = React.memo(() => {
    const [code, setCode] = useState<string>(EXAMPLE_CODES[0].code); // Initialize with first example
    const [mermaidCode, setMermaidCode] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const chartRef = useRef<HTMLDivElement>(null);
    const downloadLinkRef = useRef<HTMLAnchorElement>(null); // Ref for hidden download link

    /**
     * @function handleGenerate
     * @description Callback to initiate the flowchart generation process.
     * It sends the user's code to the AI service and updates state based on the response.
     */
    const handleGenerate = useCallback(async () => {
        if (!code.trim()) {
            setError('Please enter some code to generate a flowchart.');
            setMermaidCode('');
            if (chartRef.current) chartRef.current.innerHTML = '';
            return;
        }
        setIsLoading(true);
        setError('');
        setMermaidCode('');
        if (chartRef.current) chartRef.current.innerHTML = ''; // Clear previous chart

        try {
            const result: FlowchartResult = await generateFlowchart(code);
            if (result && result.mermaidCode) {
                setMermaidCode(result.mermaidCode);
            } else {
                throw new Error('No mermaid code received from the service.');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate flowchart: ${errorMessage}. Please check your code or try again.`);
            console.error('Flowchart generation error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [code]);

    /**
     * @function handleClear
     * @description Clears the code input and generated flowchart.
     */
    const handleClear = useCallback(() => {
        setCode('');
        setMermaidCode('');
        setError('');
        if (chartRef.current) chartRef.current.innerHTML = '';
    }, []);

    /**
     * @function handleCopyMermaidCode
     * @description Copies the generated Mermaid code to the clipboard.
     */
    const handleCopyMermaidCode = useCallback(async () => {
        if (!mermaidCode) {
            setError('No Mermaid code to copy.');
            return;
        }
        try {
            await navigator.clipboard.writeText(mermaidCode);
            alert('Mermaid code copied to clipboard!'); // Consider a toast notification for better UX
        } catch (err) {
            console.error('Failed to copy Mermaid code:', err);
            setError('Failed to copy Mermaid code.');
        }
    }, [mermaidCode]);

    /**
     * @function handleDownloadSVG
     * @description Downloads the rendered flowchart as an SVG file.
     */
    const handleDownloadSVG = useCallback(() => {
        if (!chartRef.current || !chartRef.current.querySelector('svg')) {
            setError('No flowchart to download.');
            return;
        }
        const svgElement = chartRef.current.querySelector('svg');
        if (!svgElement) {
            setError('SVG element not found for download.');
            return;
        }

        const svgData = new XMLSerializer().serializeToString(svgElement);
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        if (downloadLinkRef.current) {
            downloadLinkRef.current.href = url;
            downloadLinkRef.current.download = 'flowchart.svg';
            downloadLinkRef.current.click();
        }

        URL.revokeObjectURL(url); // Clean up the object URL
    }, []);

    /**
     * @function handleExampleSelect
     * @description Updates the code input with a selected example.
     */
    const handleExampleSelect = useCallback((selectedCode: string) => {
        setCode(selectedCode);
        setMermaidCode('');
        setError('');
        if (chartRef.current) chartRef.current.innerHTML = '';
    }, []);

    /**
     * @useEffect
     * @description Renders the Mermaid flowchart whenever `mermaidCode` changes.
     * It uses an ErrorBoundary internally to catch rendering issues from Mermaid itself.
     */
    useEffect(() => {
        if (mermaidCode && chartRef.current) {
            setError(''); // Clear previous Mermaid render errors
            chartRef.current.innerHTML = ''; // Clear existing SVG before re-rendering
            try {
                mermaid
                    .render('mermaid-chart', mermaidCode)
                    .then(({ svg }) => {
                        if (chartRef.current) {
                            chartRef.current.innerHTML = svg;
                            // Add ARIA label to SVG for accessibility if possible
                            const renderedSvg = chartRef.current.querySelector('svg');
                            if (renderedSvg) {
                                renderedSvg.setAttribute('aria-label', 'Generated Flowchart');
                                renderedSvg.setAttribute('role', 'img');
                            }
                        }
                    })
                    .catch((e) => {
                        // Catching errors specific to mermaid.render promise
                        if (e instanceof Error) {
                            setError(`Mermaid rendering error: ${e.message}. Please check the generated Mermaid code.`);
                        } else {
                            setError('An unexpected error occurred during Mermaid rendering.');
                        }
                        console.error('Mermaid render promise error:', e);
                    });
            } catch (e) {
                // Catching synchronous errors from mermaid.render call itself (less common)
                if (e instanceof Error) setError(`Mermaid initialization error: ${e.message}`);
                console.error('Mermaid render sync error:', e);
            }
        } else if (!isLoading && !error && !mermaidCode && chartRef.current) {
            // If no mermaidCode, not loading, no error, clear the chart ref.
            chartRef.current.innerHTML = '';
        }
    }, [mermaidCode, isLoading, error]); // Include isLoading and error to avoid stale closures in effects that depend on them.

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 bg-slate-900 text-slate-100">
            <header className="mb-6 border-b border-slate-700 pb-4">
                <h1 className="text-3xl font-extrabold text-slate-50 flex items-center">
                    <MapIcon className="w-8 h-8 text-cyan-400" />
                    <span className="ml-3">Code to Flowchart</span>
                </h1>
                <p className="text-slate-400 mt-2 text-md">
                    Transform your code's logic into an interactive visual flowchart using advanced AI.
                </p>
            </header>

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-0 overflow-hidden">
                {/* --- Code Input Section --- */}
                <section className="flex flex-col h-full bg-slate-800 rounded-lg shadow-xl p-4">
                    <h2 className="text-xl font-semibold text-slate-200 mb-3">Source Code Input</h2>
                    <CodeExampleSelector onSelect={handleExampleSelect} />
                    <label htmlFor="code-input" className="sr-only">
                        Enter your source code
                    </label>
                    <textarea
                        id="code-input"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="flex-grow p-4 bg-slate-900 border border-slate-700 rounded-md resize-none font-mono text-sm leading-relaxed text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200"
                        placeholder="Paste your code here (e.g., JavaScript, Python functions)..."
                        aria-describedby="code-input-help"
                        spellCheck="false"
                    />
                    <div id="code-input-help" className="sr-only">
                        Enter the source code you want to convert into a flowchart.
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="flex-1 min-w-[150px] flex items-center justify-center px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-slate-900 font-bold rounded-md shadow-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                            aria-live="polite"
                            aria-label={isLoading ? 'Generating flowchart...' : 'Generate Flowchart'}
                        >
                            {isLoading ? <LoadingSpinner size="sm" /> : 'Generate Flowchart'}
                        </button>
                        <button
                            onClick={handleClear}
                            disabled={isLoading}
                            className="flex-1 min-w-[100px] flex items-center justify-center px-4 py-3 bg-slate-600 hover:bg-slate-700 text-slate-200 font-bold rounded-md shadow-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                            aria-label="Clear code and flowchart"
                        >
                            Clear
                        </button>
                    </div>
                </section>

                {/* --- Flowchart Output Section --- */}
                <section className="flex flex-col h-full bg-slate-800 rounded-lg shadow-xl p-4">
                    <h2 className="text-xl font-semibold text-slate-200 mb-3">Generated Flowchart</h2>
                    <div className="flex-grow p-4 bg-slate-900 border border-slate-700 rounded-md overflow-auto flex flex-col items-center justify-center relative min-h-[200px]">
                        {/* ARIA live region for status updates */}
                        <div
                            aria-live="polite"
                            className="sr-only" // Hidden visually, but read by screen readers
                            role="status"
                        >
                            {isLoading && 'Loading, please wait.'}
                            {error && `Error: ${error}`}
                            {!isLoading && mermaidCode && 'Flowchart rendered successfully.'}
                        </div>

                        {isLoading && (
                            <div className="text-center text-slate-400">
                                <LoadingSpinner />
                                <p className="mt-2">Generating flowchart with AI...</p>
                            </div>
                        )}

                        {error && (
                            <p className="text-red-400 text-center p-4 bg-red-900 bg-opacity-20 rounded-md border border-red-700">
                                {error}
                            </p>
                        )}

                        {!isLoading && !mermaidCode && !error && (
                            <div className="text-slate-500 text-center p-4">
                                <MapIcon className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                                <p>Your flowchart will appear here after generation.</p>
                            </div>
                        )}

                        <ErrorBoundary
                            fallback={
                                <p className="text-yellow-400">
                                    Could not render the flowchart. The Mermaid code might be malformed.
                                </p>
                            }
                        >
                            <div ref={chartRef} className="w-full h-full flex justify-center items-center p-2" />
                        </ErrorBoundary>

                        {/* Hidden download link */}
                        <a ref={downloadLinkRef} style={{ display: 'none' }} href="#" download />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                        <button
                            onClick={handleCopyMermaidCode}
                            disabled={!mermaidCode || isLoading}
                            className="flex-1 min-w-[150px] flex items-center justify-center px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-md shadow-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                            aria-label="Copy raw Mermaid code"
                        >
                            Copy Mermaid Code
                        </button>
                        <button
                            onClick={handleDownloadSVG}
                            disabled={!mermaidCode || isLoading}
                            className="flex-1 min-w-[150px] flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md shadow-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                            aria-label="Download flowchart as SVG"
                        >
                            Download SVG
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
});