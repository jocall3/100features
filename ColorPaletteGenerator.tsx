// Copyright James Burvel Oâ€™Callaghan III
// President Citibank Demo Business Inc.

// This file has been significantly enhanced to represent an enterprise-grade React component
// for generating AI-powered color palettes. It demonstrates best practices including:
// - **TypeScript:** Strict typing for props, state, and context.
// - **State Management (Context API):** A dedicated context for managing palette generation state,
//   including base color, generated palettes, loading/error states, and a history of past palettes.
// - **Error Boundaries:** A robust `ErrorBoundary` component to gracefully handle UI errors.
// - **Accessibility (A11y):** Enhanced semantic HTML, ARIA attributes, and keyboard navigation.
// - **Performance Optimization:** Use of `React.memo` and `useCallback` to prevent unnecessary re-renders.
// - **Responsive Design:** Continued use of Tailwind CSS for a flexible layout.
// - **User Experience:** Visual feedback for actions (e.g., copy to clipboard), skeleton loaders.
// - **Modularity:** Internal components extracted for better readability and reusability.
// - **Documentation:** Comprehensive JSDoc comments for clarity and maintainability.
// - **Future-proofing:** Placeholders for features like saving/sharing.

import React, { useState, useCallback, useContext, createContext, useMemo, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { generateColorPalette } from '../../services/geminiService.ts'; // Assuming this service is robust
import { SparklesIcon, CopyIcon, ClipboardCheckIcon, HistoryIcon, SaveIcon, ShareIcon } from '../icons/FeatureIcons.tsx'; // Assuming new icons might be added
import { LoadingSpinner } from './shared/LoadingSpinner.tsx';

// ==============================================================================================
// 1. Type Definitions
// ==============================================================================================

/**
 * @typedef {object} PaletteEntry
 * @property {string} id - Unique identifier for the palette.
 * @property {string} baseColor - The base color used to generate this palette.
 * @property {string[]} colors - The array of generated colors.
 * @property {Date} generatedAt - Timestamp when the palette was generated.
 */
export interface PaletteEntry {
    id: string;
    baseColor: string;
    colors: string[];
    generatedAt: Date;
}

/**
 * @typedef {object} ColorPaletteContextType
 * @property {string} baseColor - The currently selected base color.
 * @property {(color: string) => void} setBaseColor - Function to update the base color.
 * @property {string[]} currentPalette - The most recently generated color palette.
 * @property {boolean} isLoading - True if a palette is currently being generated.
 * @property {string | null} error - Error message if palette generation failed.
 * @property {() => Promise<void>} generatePalette - Function to trigger palette generation.
 * @property {PaletteEntry[]} paletteHistory - A list of previously generated palettes.
 * @property {(palette: PaletteEntry) => void} addPaletteToHistory - Function to add a palette to history.
 * @property {(paletteId: string) => void} applyPaletteFromHistory - Function to apply a historical palette.
 * @property {() => void} clearPaletteHistory - Function to clear all historical palettes.
 */
export interface ColorPaletteContextType {
    baseColor: string;
    setBaseColor: (color: string) => void;
    currentPalette: string[];
    isLoading: boolean;
    error: string | null;
    generatePalette: () => Promise<void>;
    paletteHistory: PaletteEntry[];
    addPaletteToHistory: (palette: PaletteEntry) => void;
    applyPaletteFromHistory: (paletteId: string) => void;
    clearPaletteHistory: () => void;
    // Add other context-related states/actions as needed (e.g., save, share options)
}

// ==============================================================================================
// 2. Context API Setup
// ==============================================================================================

/**
 * @constant {React.Context<ColorPaletteContextType | undefined>} ColorPaletteContext
 * @description React Context for managing color palette generation state globally within its subtree.
 */
export const ColorPaletteContext = createContext<ColorPaletteContextType | undefined>(undefined);

/**
 * @function useColorPalette
 * @description Custom hook to consume the ColorPaletteContext, ensuring it's used within a Provider.
 * @returns {ColorPaletteContextType} The current context value.
 * @throws {Error} If `useColorPalette` is used outside of a `ColorPaletteProvider`.
 */
export const useColorPalette = (): ColorPaletteContextType => {
    const context = useContext(ColorPaletteContext);
    if (context === undefined) {
        throw new Error('useColorPalette must be used within a ColorPaletteProvider');
    }
    return context;
};

/**
 * @function ColorPaletteProvider
 * @description Provides the color palette generation state and actions to its children.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components to be wrapped by the provider.
 * @returns {JSX.Element} The provider component.
 */
export const ColorPaletteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [baseColor, setBaseColor] = useState<string>("#06b6d4");
    const [currentPalette, setCurrentPalette] = useState<string[]>(['#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63', '#083344']);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [paletteHistory, setPaletteHistory] = useState<PaletteEntry[]>(() => {
        // Load history from localStorage on initial render
        if (typeof window !== 'undefined') {
            try {
                const storedHistory = localStorage.getItem('colorPaletteHistory');
                return storedHistory ? JSON.parse(storedHistory).map((item: any) => ({
                    ...item,
                    generatedAt: new Date(item.generatedAt) // Ensure Date objects are re-hydrated
                })) : [];
            } catch (e) {
                console.error("Failed to load palette history from localStorage", e);
                return [];
            }
        }
        return [];
    });

    // Effect to save history to localStorage whenever it changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem('colorPaletteHistory', JSON.stringify(paletteHistory));
            } catch (e) {
                console.error("Failed to save palette history to localStorage", e);
            }
        }
    }, [paletteHistory]);


    /**
     * @function handleGeneratePalette
     * @description Asynchronously generates a new color palette based on the current base color.
     * Updates loading, error, and palette states, and adds the new palette to history.
     */
    const handleGeneratePalette = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateColorPalette(baseColor);
            const newPaletteEntry: PaletteEntry = {
                id: crypto.randomUUID(), // Use Web Crypto API for unique IDs
                baseColor: baseColor,
                colors: result.colors,
                generatedAt: new Date(),
            };
            setCurrentPalette(result.colors);
            setPaletteHistory((prevHistory) => [newPaletteEntry, ...prevHistory].slice(0, 10)); // Keep last 10
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during palette generation.';
            setError(`Failed to generate palette: ${errorMessage}`);
            setCurrentPalette([]); // Clear palette on error
        } finally {
            setIsLoading(false);
        }
    }, [baseColor]);

    /**
     * @function addPaletteToHistory
     * @description Manually adds a palette entry to the history. Useful for programmatically adding.
     * @param {PaletteEntry} palette - The palette entry to add.
     */
    const addPaletteToHistory = useCallback((palette: PaletteEntry) => {
        setPaletteHistory((prevHistory) => [palette, ...prevHistory].slice(0, 10));
    }, []);

    /**
     * @function applyPaletteFromHistory
     * @description Sets the current palette and base color from a historical entry.
     * @param {string} paletteId - The ID of the palette entry to apply.
     */
    const applyPaletteFromHistory = useCallback((paletteId: string) => {
        const historicalPalette = paletteHistory.find(p => p.id === paletteId);
        if (historicalPalette) {
            setBaseColor(historicalPalette.baseColor);
            setCurrentPalette(historicalPalette.colors);
            setError(null); // Clear any previous errors
        }
    }, [paletteHistory]);

    /**
     * @function clearPaletteHistory
     * @description Clears all entries from the palette history.
     */
    const clearPaletteHistory = useCallback(() => {
        setPaletteHistory([]);
    }, []);

    const contextValue = useMemo(() => ({
        baseColor,
        setBaseColor,
        currentPalette,
        isLoading,
        error,
        generatePalette: handleGeneratePalette,
        paletteHistory,
        addPaletteToHistory,
        applyPaletteFromHistory,
        clearPaletteHistory,
    }), [baseColor, currentPalette, isLoading, error, handleGeneratePalette, paletteHistory, addPaletteToHistory, applyPaletteFromHistory, clearPaletteHistory]);

    return (
        <ColorPaletteContext.Provider value={contextValue}>
            {children}
        </ColorPaletteContext.Provider>
    );
};

// ==============================================================================================
// 3. Error Boundary Component
// ==============================================================================================

/**
 * @interface ErrorBoundaryProps
 * @extends {React.PropsWithChildren<{}>}
 * @property {string} [fallbackMessage] - Optional message to display on error.
 */
export interface ErrorBoundaryProps extends React.PropsWithChildren<{}> {
    fallbackMessage?: string;
}

/**
 * @interface ErrorBoundaryState
 * @property {boolean} hasError - Indicates if an error has occurred.
 * @property {Error | null} error - The caught error object.
 * @property {React.ErrorInfo | null} errorInfo - The component stack during error.
 */
interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

/**
 * @class ErrorBoundary
 * @extends {React.Component<ErrorBoundaryProps, ErrorBoundaryState>}
 * @description A reusable React error boundary component to catch JavaScript errors
 * anywhere in their child component tree, log those errors, and display a fallback UI.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    /**
     * @static
     * @method getDerivedStateFromError
     * @description Lifecycle method to update state so the next render will show the fallback UI.
     * @param {Error} error - The error that was thrown.
     * @returns {ErrorBoundaryState} The updated state.
     */
    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error, errorInfo: null };
    }

    /**
     * @method componentDidCatch
     * @description Lifecycle method to catch errors and log error information.
     * @param {Error} error - The error that was thrown.
     * @param {React.ErrorInfo} errorInfo - Component stack information.
     */
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div role="alert" className="flex flex-col items-center justify-center p-8 bg-red-900 bg-opacity-30 border border-red-700 rounded-lg text-red-100 text-center shadow-lg">
                    <h2 className="text-2xl font-bold mb-3">Oops! Something went wrong.</h2>
                    <p className="text-lg mb-4">{this.props.fallbackMessage || "We're sorry for the inconvenience. Please try refreshing the page."}</p>
                    {this.state.error && (
                        <details className="text-sm mt-4 p-2 bg-red-800 rounded-md max-h-48 overflow-auto w-full text-left">
                            <summary className="cursor-pointer font-semibold">Error Details</summary>
                            <pre className="whitespace-pre-wrap break-words mt-2">
                                {this.state.error.toString()}
                                <br />
                                {this.state.errorInfo?.componentStack}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

// ==============================================================================================
// 4. Reusable UI Components
// ==============================================================================================

/**
 * @interface ColorInputSectionProps
 * @property {string} color - The current hex color string.
 * @property {(color: string) => void} onChange - Callback for color change.
 * @property {boolean} isLoading - Whether a loading state is active.
 * @property {string | null} error - Error message to display.
 * @property {() => void} onGenerate - Callback to trigger palette generation.
 */
export interface ColorInputSectionProps {
    color: string;
    onChange: (color: string) => void;
    isLoading: boolean;
    error: string | null;
    onGenerate: () => void;
}

/**
 * @constant ColorInputSection
 * @description Renders the color picker, current color display, and generate button.
 * @param {ColorInputSectionProps} props - The component props.
 * @returns {JSX.Element} The rendered component.
 */
export const ColorInputSection: React.FC<ColorInputSectionProps> = React.memo(({ color, onChange, isLoading, error, onGenerate }) => {
    return (
        <div className="flex flex-col items-center gap-4 p-4 md:p-6 bg-slate-800 rounded-lg shadow-xl">
            <label htmlFor="base-color-picker" className="sr-only">Choose a base color</label>
            <HexColorPicker
                id="base-color-picker"
                color={color}
                onChange={onChange}
                className="!w-64 !h-64 sm:!w-72 sm:!h-72 lg:!w-80 lg:!h-80" // Responsive sizing
            />
            <div
                className="p-2 bg-slate-900 rounded-md font-mono text-lg font-bold text-slate-100 text-center w-48 transition-colors duration-200"
                style={{ border: `2px solid ${color}` }}
                aria-live="polite"
                aria-atomic="true"
            >
                {color.toUpperCase()}
            </div>
            <button
                onClick={onGenerate}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-cyan-500 text-slate-900 font-bold rounded-md hover:bg-cyan-400 transition-colors duration-200 ease-in-out disabled:bg-slate-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                aria-label={isLoading ? "Generating palette" : "Generate new palette"}
            >
                {isLoading ? <LoadingSpinner size="sm" /> : <SparklesIcon className="w-5 h-5" />}
                <span className="ml-2">{isLoading ? 'Generating...' : 'Generate Palette'}</span>
            </button>
            {error && (
                <p role="alert" className="text-red-400 text-sm mt-2 p-2 bg-red-900/30 rounded-md border border-red-700 w-full text-center">
                    {error}
                </p>
            )}
        </div>
    );
});

/**
 * @interface PaletteColorItemProps
 * @property {string} color - The hex color string to display.
 * @property {(color: string) => void} onCopy - Callback function to copy the color to clipboard.
 */
export interface PaletteColorItemProps {
    color: string;
    onCopy: (color: string) => void;
}

/**
 * @constant PaletteColorItem
 * @description Displays a single color from the palette with a copy button.
 * Provides visual feedback on copy action and accessibility improvements.
 * @param {PaletteColorItemProps} props - The component props.
 * @returns {JSX.Element} The rendered component.
 */
export const PaletteColorItem: React.FC<PaletteColorItemProps> = React.memo(({ color, onCopy }) => {
    const [copied, setCopied] = useState(false);

    const handleCopyClick = useCallback(() => {
        onCopy(color);
        setCopied(true);
        const timer = setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
        return () => clearTimeout(timer);
    }, [color, onCopy]);

    // Determine text color based on background luminance for readability
    const getTextColor = useCallback((hexColor: string) => {
        const r = parseInt(hexColor.substring(1, 3), 16);
        const g = parseInt(hexColor.substring(3, 5), 16);
        const b = parseInt(hexColor.substring(5, 7), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? 'text-gray-900' : 'text-white';
    }, []);

    const textColorClass = useMemo(() => getTextColor(color), [color, getTextColor]);

    return (
        <div
            role="listitem"
            className="group flex items-center justify-between p-4 rounded-md shadow-sm transition-all duration-150 ease-in-out hover:shadow-lg"
            style={{ backgroundColor: color }}
            tabIndex={0} // Make the div focusable for keyboard users
            aria-label={`Color: ${color}`}
        >
            <span className={`font-mono font-bold text-lg ${textColorClass} drop-shadow-sm`}>{color.toUpperCase()}</span>
            <button
                onClick={handleCopyClick}
                className="relative flex items-center justify-center p-2 min-w-[70px] opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 ease-in-out bg-white/30 hover:bg-white/50 focus:bg-white/50 rounded text-xs text-black font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-1 focus:ring-offset-transparent"
                aria-live="polite"
                aria-label={copied ? `Copied ${color}` : `Copy color ${color}`}
            >
                {copied ? <ClipboardCheckIcon className="w-4 h-4 mr-1 text-green-700" /> : <CopyIcon className="w-4 h-4 mr-1" />}
                {copied ? 'Copied!' : 'Copy'}
            </button>
        </div>
    );
});


/**
 * @interface PaletteDisplaySectionProps
 * @property {string[]} palette - The array of colors to display.
 * @property {boolean} isLoading - Whether a loading state is active.
 * @property {(color: string) => void} onCopyColor - Callback for copying a single color.
 */
export interface PaletteDisplaySectionProps {
    palette: string[];
    isLoading: boolean;
    onCopyColor: (color: string) => void;
}

/**
 * @constant PaletteDisplaySection
 * @description Renders the generated color palette, showing a skeleton loader during loading.
 * @param {PaletteDisplaySectionProps} props - The component props.
 * @returns {JSX.Element} The rendered component.
 */
export const PaletteDisplaySection: React.FC<PaletteDisplaySectionProps> = React.memo(({ palette, isLoading, onCopyColor }) => {
    return (
        <div className="flex flex-col gap-3 w-full max-w-sm p-4 md:p-6 bg-slate-800 rounded-lg shadow-xl">
            <h2 className="text-xl font-bold text-slate-100 mb-2" id="generated-palette-label">
                Generated Palette
            </h2>
            <div role="list" aria-labelledby="generated-palette-label" className="flex flex-col gap-2">
                {isLoading ? (
                    // Skeleton loader for palette items
                    Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="h-14 bg-slate-700 rounded-md animate-pulse"></div>
                    ))
                ) : (
                    palette.length > 0 ? (
                        palette.map((color) => (
                            <PaletteColorItem key={color} color={color} onCopy={onCopyColor} />
                        ))
                    ) : (
                        <p className="text-slate-400 text-center py-8">No palette generated yet. Pick a color and hit "Generate"!</p>
                    )
                )}
            </div>
            {/* Action buttons for the palette */}
            {!isLoading && palette.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                    <button
                        className="flex items-center gap-1 px-4 py-2 bg-slate-700 text-slate-100 rounded-md text-sm hover:bg-slate-600 transition-colors"
                        aria-label="Save current palette"
                        title="Save Palette (Coming Soon)"
                        disabled // Placeholder for future functionality
                    >
                        <SaveIcon className="w-4 h-4" /> Save
                    </button>
                    <button
                        className="flex items-center gap-1 px-4 py-2 bg-slate-700 text-slate-100 rounded-md text-sm hover:bg-slate-600 transition-colors"
                        aria-label="Share current palette"
                        title="Share Palette (Coming Soon)"
                        disabled // Placeholder for future functionality
                    >
                        <ShareIcon className="w-4 h-4" /> Share
                    </button>
                </div>
            )}
        </div>
    );
});


/**
 * @interface PaletteHistorySectionProps
 * @property {PaletteEntry[]} history - Array of historical palette entries.
 * @property {(paletteId: string) => void} onApplyPalette - Callback to apply a historical palette.
 * @property {() => void} onClearHistory - Callback to clear the entire history.
 */
export interface PaletteHistorySectionProps {
    history: PaletteEntry[];
    onApplyPalette: (paletteId: string) => void;
    onClearHistory: () => void;
}

/**
 * @constant PaletteHistorySection
 * @description Displays a list of previously generated color palettes, allowing users to re-apply them.
 * @param {PaletteHistorySectionProps} props - The component props.
 * @returns {JSX.Element} The rendered component.
 */
export const PaletteHistorySection: React.FC<PaletteHistorySectionProps> = React.memo(({ history, onApplyPalette, onClearHistory }) => {
    const [showConfirmClear, setShowConfirmClear] = useState(false);

    const handleClearConfirm = () => {
        onClearHistory();
        setShowConfirmClear(false);
    };

    return (
        <div className="flex flex-col gap-3 w-full max-w-sm p-4 md:p-6 bg-slate-800 rounded-lg shadow-xl min-h-[200px]">
            <h2 className="text-xl font-bold text-slate-100 mb-2 flex items-center">
                <HistoryIcon className="w-5 h-5 mr-2" /> Palette History
            </h2>
            {history.length === 0 ? (
                <p className="text-slate-400 text-center py-4">No history yet. Generate a palette to see it here!</p>
            ) : (
                <div role="list" aria-label="Generated Palette History" className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {history.map((entry) => (
                        <button
                            key={entry.id}
                            onClick={() => onApplyPalette(entry.id)}
                            className="flex flex-col items-start p-3 bg-slate-700 rounded-md hover:bg-slate-600 transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                            aria-label={`Apply palette generated from ${entry.baseColor} on ${entry.generatedAt.toLocaleDateString()}`}
                            role="listitem"
                        >
                            <span className="font-mono text-sm font-bold text-slate-100 mb-1">{entry.baseColor.toUpperCase()}</span>
                            <div className="flex gap-1 w-full flex-wrap">
                                {entry.colors.map((color, idx) => (
                                    <span
                                        key={idx}
                                        className="w-6 h-6 rounded-full border border-slate-600"
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    ></span>
                                ))}
                            </div>
                            <span className="text-xs text-slate-400 mt-2 self-end">
                                {entry.generatedAt.toLocaleTimeString()} - {entry.generatedAt.toLocaleDateString()}
                            </span>
                        </button>
                    ))}
                </div>
            )}
            {history.length > 0 && (
                <div className="mt-4 border-t border-slate-700 pt-4">
                    {!showConfirmClear ? (
                        <button
                            onClick={() => setShowConfirmClear(true)}
                            className="w-full px-4 py-2 bg-red-700 text-white rounded-md text-sm hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                            aria-label="Clear all palette history"
                        >
                            Clear History
                        </button>
                    ) : (
                        <div className="flex items-center justify-between gap-2 p-2 bg-red-900 rounded-md">
                            <span className="text-red-100 text-sm">Are you sure?</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleClearConfirm}
                                    className="px-3 py-1 bg-red-500 text-white rounded-md text-xs hover:bg-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
                                    aria-label="Confirm clear history"
                                >
                                    Yes, Clear
                                </button>
                                <button
                                    onClick={() => setShowConfirmClear(false)}
                                    className="px-3 py-1 bg-slate-600 text-white rounded-md text-xs hover:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
                                    aria-label="Cancel clear history"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});

// ==============================================================================================
// 5. Main ColorPaletteGenerator Component
// ==============================================================================================

/**
 * @constant ColorPaletteGenerator
 * @description The main component for generating AI-powered color palettes.
 * It orchestrates the UI, handles user interactions, and utilizes the ColorPaletteContext
 * for state management. Wrapped in an ErrorBoundary for robustness.
 * @returns {JSX.Element} The rendered color palette generator application section.
 */
export const ColorPaletteGenerator: React.FC = () => {
    const {
        baseColor,
        setBaseColor,
        currentPalette,
        isLoading,
        error,
        generatePalette,
        paletteHistory,
        applyPaletteFromHistory,
        clearPaletteHistory,
    } = useColorPalette();

    // Callback for copying individual colors
    const handleCopyColor = useCallback((color: string) => {
        navigator.clipboard.writeText(color);
        // Additional feedback can be added here (e.g., a toast notification)
    }, []);

    return (
        <ErrorBoundary fallbackMessage="Failed to render the Color Palette Generator.">
            <div className="h-full min-h-screen flex flex-col p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 font-sans">
                <header className="mb-8 text-center">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-cyan-400 flex items-center justify-center animate-fade-in">
                        <SparklesIcon className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-300" />
                        <span className="ml-4 drop-shadow-lg">AI Color Palette Generator</span>
                    </h1>
                    <p className="text-slate-300 mt-2 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
                        Unleash creativity with AI. Pick a base color and let Gemini design a harmonious palette tailored for your next project.
                    </p>
                    <meta name="description" content="Generate beautiful AI-powered color palettes from a base color. Perfect for designers and developers." />
                    <meta name="keywords" content="AI, color palette, generator, Gemini, React, design, UI/UX, hex color" />
                    <meta property="og:title" content="AI Color Palette Generator" />
                    <meta property="og:description" content="Create stunning color schemes with artificial intelligence." />
                    <meta property="og:type" content="website" />
                    {/* Add more SEO tags as necessary, considering this component will be part of a larger app. */}
                </header>

                <main className="flex-grow flex flex-col md:flex-row items-stretch justify-center gap-8 lg:gap-12 w-full max-w-6xl mx-auto my-auto py-8">
                    {/* Color Input Section */}
                    <section aria-labelledby="color-input-heading" className="flex-1 min-w-[300px] max-w-full md:max-w-md">
                        <h2 id="color-input-heading" className="sr-only">Color Selection and Generation</h2>
                        <ColorInputSection
                            color={baseColor}
                            onChange={setBaseColor}
                            isLoading={isLoading}
                            error={error}
                            onGenerate={generatePalette}
                        />
                    </section>

                    {/* Palette Display Section */}
                    <section aria-labelledby="palette-display-heading" className="flex-1 min-w-[300px] max-w-full md:max-w-md">
                        <h2 id="palette-display-heading" className="sr-only">Generated Color Palette</h2>
                        <PaletteDisplaySection
                            palette={currentPalette}
                            isLoading={isLoading}
                            onCopyColor={handleCopyColor}
                        />
                    </section>

                    {/* Palette History Section */}
                    <aside aria-labelledby="palette-history-heading" className="flex-1 min-w-[300px] max-w-full md:max-w-md">
                        <h2 id="palette-history-heading" className="sr-only">Palette History</h2>
                        <PaletteHistorySection
                            history={paletteHistory}
                            onApplyPalette={applyPaletteFromHistory}
                            onClearHistory={clearPaletteHistory}
                        />
                    </aside>
                </main>

                <footer className="mt-12 text-center text-slate-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} Citibank Demo Business Inc. All rights reserved.</p>
                    <p className="mt-1">Powered by Gemini AI and crafted with React & TypeScript.</p>
                </footer>
            </div>
        </ErrorBoundary>
    );
};
