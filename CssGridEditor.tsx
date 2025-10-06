// App: CSS Grid Visual Editor
//
// This file contains a single, self-contained React application for visually editing CSS Grid layouts.
// It combines multiple functionalities into an enterprise-grade solution, demonstrating best practices
// in state management, accessibility, performance optimization, and robust error handling.
//
// Features:
// - **Interactive Grid Editor**: Adjust rows, columns, and gaps with live visual feedback.
// - **Gap Unit Selection**: Choose between `rem`, `px`, or `em` units for grid gaps.
// - **Advanced Grid Properties**: Controls for `justify-items`, `align-items`, `justify-content`, and `align-content`.
// - **Real-time CSS Generation**: Dynamically generates CSS code as settings are adjusted.
// - **Copy to Clipboard**: One-click copy for the generated CSS.
// - **Theming**: Toggle between light and dark modes (example: dark mode is default/implemented).
// - **Persistent Settings**: User settings (grid parameters, theme) are saved and loaded from local storage.
// - **Error Handling**: Implements a global error boundary for robustness.
// - **Accessibility (A11y)**: Uses semantic HTML, `label`/`htmlFor`, `aria-` attributes for improved accessibility.
// - **Performance Optimization**: Utilizes `useMemo` and `React.memo` to prevent unnecessary re-renders.
// - **Responsive Design**: Built with Tailwind CSS for a responsive layout.
// - **TypeScript**: Strongly typed throughout for maintainability and scalability.
//
// Structure:
// - **Types**: Interfaces for props and state.
// - **Contexts**: React Context API for theme and grid settings management.
// - **Error Boundary**: A generic React component for catching UI errors.
// - **Utility Components**: Small, reusable components like `GridItem`.
// - **App Component**: The main application component, encapsulating all logic and UI.

import React, { useState, useMemo, useCallback, createContext, useContext, useEffect, memo } from 'react';
import { CodeBracketSquareIcon } from './icons/FeatureIcons.tsx'; // Assuming FeatureIcons.tsx is in the same directory or correctly aliased

// --- Types ---

/**
 * @typedef {('rem' | 'px' | 'em')} GapUnit
 * Represents the possible units for grid gaps.
 */
type GapUnit = 'rem' | 'px' | 'em';

/**
 * @typedef {('start' | 'end' | 'center' | 'stretch')} JustifyAlignItems
 * Represents possible values for `justify-items` and `align-items`.
 */
type JustifyAlignItems = 'start' | 'end' | 'center' | 'stretch';

/**
 * @typedef {('start' | 'end' | 'center' | 'stretch' | 'space-around' | 'space-between' | 'space-evenly')} JustifyAlignContent
 * Represents possible values for `justify-content` and `align-content`.
 */
type JustifyAlignContent = 'start' | 'end' | 'center' | 'stretch' | 'space-around' | 'space-between' | 'space-evenly';

/**
 * @interface GridSettingsState
 * Defines the shape of the state managed by the GridSettingsContext.
 */
interface GridSettingsState {
    rows: number;
    cols: number;
    rowGap: number;
    colGap: number;
    gapUnit: GapUnit;
    justifyItems: JustifyAlignItems;
    alignItems: JustifyAlignItems;
    justifyContent: JustifyAlignContent;
    alignContent: JustifyAlignContent;
    showItemNumbers: boolean;
    setRows: (rows: number) => void;
    setCols: (cols: number) => void;
    setRowGap: (gap: number) => void;
    setColGap: (gap: number) => void;
    setGapUnit: (unit: GapUnit) => void;
    setJustifyItems: (value: JustifyAlignItems) => void;
    setAlignItems: (value: JustifyAlignItems) => void;
    setJustifyContent: (value: JustifyAlignContent) => void;
    setAlignContent: (value: JustifyAlignContent) => void;
    toggleShowItemNumbers: () => void;
    resetDefaults: () => void;
}

/**
 * @interface ThemeContextType
 * Defines the shape of the state managed by the ThemeContext.
 */
interface ThemeContextType {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

/**
 * @interface ErrorBoundaryProps
 * Props for the ErrorBoundary component.
 */
interface ErrorBoundaryProps {
    children: React.ReactNode;
}

/**
 * @interface ErrorBoundaryState
 * State for the ErrorBoundary component.
 */
interface ErrorBoundaryState {
    hasError: boolean;
}

/**
 * @interface GridItemProps
 * Props for the memoized GridItem component.
 */
interface GridItemProps {
    index: number;
    showItemNumbers: boolean;
}

// --- Contexts ---

// Default values for grid settings
const DEFAULT_GRID_SETTINGS = {
    rows: 3,
    cols: 4,
    rowGap: 1, // in rem
    colGap: 1, // in rem
    gapUnit: 'rem' as GapUnit,
    justifyItems: 'stretch' as JustifyAlignItems,
    alignItems: 'stretch' as JustifyAlignItems,
    justifyContent: 'start' as JustifyAlignContent,
    alignContent: 'start' as JustifyAlignContent,
    showItemNumbers: true,
};

// @ts-ignore - Initial context value will be set in the provider
const GridSettingsContext = createContext<GridSettingsState>(null);

export const useGridSettings = () => {
    const context = useContext(GridSettingsContext);
    if (!context) {
        throw new Error('useGridSettings must be used within a GridSettingsProvider');
    }
    return context;
};

export const GridSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState(() => {
        try {
            const storedSettings = localStorage.getItem('gridEditorSettings');
            return storedSettings ? { ...DEFAULT_GRID_SETTINGS, ...JSON.parse(storedSettings) } : DEFAULT_GRID_SETTINGS;
        } catch (error) {
            console.error("Failed to parse stored grid settings from localStorage", error);
            return DEFAULT_GRID_SETTINGS;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('gridEditorSettings', JSON.stringify(settings));
        } catch (error) {
            console.error("Failed to save grid settings to localStorage", error);
        }
    }, [settings]);

    const setRows = useCallback((rows: number) => setSettings(prev => ({ ...prev, rows })), []);
    const setCols = useCallback((cols: number) => setSettings(prev => ({ ...prev, cols })), []);
    const setRowGap = useCallback((rowGap: number) => setSettings(prev => ({ ...prev, rowGap })), []);
    const setColGap = useCallback((colGap: number) => setSettings(prev => ({ ...prev, colGap })), []);
    const setGapUnit = useCallback((gapUnit: GapUnit) => setSettings(prev => ({ ...prev, gapUnit })), []);
    const setJustifyItems = useCallback((value: JustifyAlignItems) => setSettings(prev => ({ ...prev, justifyItems: value })), []);
    const setAlignItems = useCallback((value: JustifyAlignItems) => setSettings(prev => ({ ...prev, alignItems: value })), []);
    const setJustifyContent = useCallback((value: JustifyAlignContent) => setSettings(prev => ({ ...prev, justifyContent: value })), []);
    const setAlignContent = useCallback((value: JustifyAlignContent) => setSettings(prev => ({ ...prev, alignContent: value })), []);
    const toggleShowItemNumbers = useCallback(() => setSettings(prev => ({ ...prev, showItemNumbers: !prev.showItemNumbers })), []);
    const resetDefaults = useCallback(() => setSettings(DEFAULT_GRID_SETTINGS), []);

    const value = useMemo(() => ({
        ...settings,
        setRows, setCols, setRowGap, setColGap, setGapUnit,
        setJustifyItems, setAlignItems, setJustifyContent, setAlignContent,
        toggleShowItemNumbers, resetDefaults
    }), [
        settings, setRows, setCols, setRowGap, setColGap, setGapUnit,
        setJustifyItems, setAlignItems, setJustifyContent, setAlignContent,
        toggleShowItemNumbers, resetDefaults
    ]);

    return (
        <GridSettingsContext.Provider value={value}>
            {children}
        </GridSettingsContext.Provider>
    );
};

// @ts-ignore - Initial context value will be set in the provider
const ThemeContext = createContext<ThemeContextType>(null);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        try {
            const storedTheme = localStorage.getItem('gridEditorTheme');
            return (storedTheme === 'light' || storedTheme === 'dark') ? storedTheme : 'dark';
        } catch (error) {
            console.error("Failed to parse stored theme from localStorage", error);
            return 'dark';
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('gridEditorTheme', theme);
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(theme);
        } catch (error) {
            console.error("Failed to save theme to localStorage", error);
        }
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    }, []);

    const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

// --- Error Boundary ---

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(_: Error): ErrorBoundaryState {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // You can log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="flex flex-col items-center justify-center h-screen bg-red-900 text-white p-4">
                    <h2 className="text-2xl font-bold mb-4">Oops! Something went wrong.</h2>
                    <p className="text-lg mb-6">We're sorry for the inconvenience. Please try refreshing the page.</p>
                    <button
                        className="px-6 py-3 bg-red-700 hover:bg-red-600 rounded-md text-white font-medium"
                        onClick={() => window.location.reload()}
                    >
                        Refresh Page
                    </button>
                    <p className="mt-8 text-sm text-red-300">
                        If the problem persists, please contact support.
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}

// --- Utility Components ---

/**
 * @component GridItem
 * Renders a single item within the CSS Grid preview.
 * Memoized for performance to prevent re-renders unless its props change.
 */
export const GridItem: React.FC<GridItemProps> = memo(({ index, showItemNumbers }) => {
    return (
        <div className="bg-cyan-500/20 rounded-lg border-2 border-dashed border-cyan-400/50 flex items-center justify-center text-cyan-300">
            {showItemNumbers && <span className="text-xs opacity-70">{index + 1}</span>}
        </div>
    );
});

// --- Main App Component ---

/**
 * @component App
 * The main application component for the CSS Grid Visual Editor.
 * This component orchestrates the state, controls, and visual preview of the CSS Grid.
 */
export const App: React.FC = () => {
    const {
        rows, cols, rowGap, colGap, gapUnit,
        justifyItems, alignItems, justifyContent, alignContent,
        showItemNumbers,
        setRows, setCols, setRowGap, setColGap, setGapUnit,
        setJustifyItems, setAlignItems, setJustifyContent, setAlignContent,
        toggleShowItemNumbers, resetDefaults
    } = useGridSettings();
    const { theme, toggleTheme } = useTheme();
    const [copied, setCopied] = useState(false);

    // CSS-in-JS style for the grid container
    const gridStyle = useMemo(() => {
        return {
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`,
            gap: `${rowGap}${gapUnit} ${colGap}${gapUnit}`,
            justifyItems,
            alignItems,
            justifyContent,
            alignContent,
            height: '100%',
            width: '100%',
            overflow: 'auto', // In case items exceed container in small viewports
        };
    }, [rows, cols, rowGap, colGap, gapUnit, justifyItems, alignItems, justifyContent, alignContent]);

    // Generated CSS code for display
    const cssCode = useMemo(() => {
        return `.grid-container {
  display: grid;
  grid-template-columns: repeat(${cols}, 1fr);
  grid-template-rows: repeat(${rows}, 1fr);
  gap: ${rowGap}${gapUnit} ${colGap}${gapUnit};
  ${justifyItems !== 'stretch' ? `justify-items: ${justifyItems};\n  ` : ''}${alignItems !== 'stretch' ? `align-items: ${alignItems};\n  ` : ''}${justifyContent !== 'start' ? `justify-content: ${justifyContent};\n  ` : ''}${alignContent !== 'start' ? `align-content: ${alignContent};\n  ` : ''}
}`;
    }, [rows, cols, rowGap, colGap, gapUnit, justifyItems, alignItems, justifyContent, alignContent]);

    /**
     * Handles copying the generated CSS code to the clipboard.
     * Provides visual feedback to the user.
     */
    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(cssCode)
            .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000); // Reset copied state after 2 seconds
            })
            .catch(err => {
                console.error('Failed to copy CSS:', err);
                // Optionally provide error feedback to user
            });
    }, [cssCode]);

    return (
        <div className={`h-full flex flex-col p-4 sm:p-6 lg:p-8 ${theme === 'dark' ? 'dark-theme' : 'light-theme'}`}>
            <header className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center mb-4 sm:mb-0">
                    <CodeBracketSquareIcon className="w-8 h-8 text-cyan-400" />
                    <span className="ml-3">CSS Grid Visual Editor</span>
                </h1>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={toggleTheme}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-md text-sm text-slate-200"
                        aria-label={`Toggle theme, current theme is ${theme}`}
                    >
                        {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
                    </button>
                    <button
                        onClick={resetDefaults}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-md text-sm text-slate-200"
                        aria-label="Reset all grid settings to default"
                    >
                        Reset
                    </button>
                </div>
            </header>
            <p className="text-slate-400 mt-1 mb-6">Configure your grid layout and copy the generated CSS.</p>

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                {/* Controls Section */}
                <div className="lg:col-span-1 flex flex-col gap-4 bg-slate-800/50 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-bold text-slate-200 mb-2">Controls</h3>
                    <div className="space-y-4">
                        {/* Rows */}
                        <div>
                            <label htmlFor="rows" className="block text-sm font-medium text-slate-400">Rows ({rows})</label>
                            <input
                                id="rows"
                                type="range"
                                min="1"
                                max="12"
                                value={rows}
                                onChange={e => setRows(Number(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer range-sm"
                                aria-valuenow={rows}
                                aria-valuemin={1}
                                aria-valuemax={12}
                                aria-valuetext={`${rows} rows`}
                            />
                        </div>
                        {/* Columns */}
                        <div>
                            <label htmlFor="cols" className="block text-sm font-medium text-slate-400">Columns ({cols})</label>
                            <input
                                id="cols"
                                type="range"
                                min="1"
                                max="12"
                                value={cols}
                                onChange={e => setCols(Number(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer range-sm"
                                aria-valuenow={cols}
                                aria-valuemin={1}
                                aria-valuemax={12}
                                aria-valuetext={`${cols} columns`}
                            />
                        </div>
                        {/* Gap Unit */}
                        <div>
                            <label htmlFor="gapUnit" className="block text-sm font-medium text-slate-400">Gap Unit</label>
                            <select
                                id="gapUnit"
                                value={gapUnit}
                                onChange={e => setGapUnit(e.target.value as GapUnit)}
                                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-slate-200 text-sm focus:ring-cyan-500 focus:border-cyan-500"
                                aria-label="Select gap unit"
                            >
                                <option value="rem">rem</option>
                                <option value="px">px</option>
                                <option value="em">em</option>
                            </select>
                        </div>
                        {/* Row Gap */}
                        <div>
                            <label htmlFor="rowGap" className="block text-sm font-medium text-slate-400">Row Gap ({rowGap}{gapUnit})</label>
                            <input
                                id="rowGap"
                                type="range"
                                min="0"
                                max="8"
                                step="0.25"
                                value={rowGap}
                                onChange={e => setRowGap(Number(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer range-sm"
                                aria-valuenow={rowGap}
                                aria-valuemin={0}
                                aria-valuemax={8}
                                aria-valuetext={`${rowGap}${gapUnit} row gap`}
                            />
                        </div>
                        {/* Column Gap */}
                        <div>
                            <label htmlFor="colGap" className="block text-sm font-medium text-slate-400">Column Gap ({colGap}{gapUnit})</label>
                            <input
                                id="colGap"
                                type="range"
                                min="0"
                                max="8"
                                step="0.25"
                                value={colGap}
                                onChange={e => setColGap(Number(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer range-sm"
                                aria-valuenow={colGap}
                                aria-valuemin={0}
                                aria-valuemax={8}
                                aria-valuetext={`${colGap}${gapUnit} column gap`}
                            />
                        </div>
                        {/* Justify Items */}
                        <div>
                            <label htmlFor="justifyItems" className="block text-sm font-medium text-slate-400">Justify Items</label>
                            <select
                                id="justifyItems"
                                value={justifyItems}
                                onChange={e => setJustifyItems(e.target.value as JustifyAlignItems)}
                                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-slate-200 text-sm focus:ring-cyan-500 focus:border-cyan-500"
                                aria-label="Select justify items property"
                            >
                                <option value="stretch">stretch</option>
                                <option value="start">start</option>
                                <option value="end">end</option>
                                <option value="center">center</option>
                            </select>
                        </div>
                        {/* Align Items */}
                        <div>
                            <label htmlFor="alignItems" className="block text-sm font-medium text-slate-400">Align Items</label>
                            <select
                                id="alignItems"
                                value={alignItems}
                                onChange={e => setAlignItems(e.target.value as JustifyAlignItems)}
                                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-slate-200 text-sm focus:ring-cyan-500 focus:border-cyan-500"
                                aria-label="Select align items property"
                            >
                                <option value="stretch">stretch</option>
                                <option value="start">start</option>
                                <option value="end">end</option>
                                <option value="center">center</option>
                            </select>
                        </div>
                        {/* Justify Content */}
                        <div>
                            <label htmlFor="justifyContent" className="block text-sm font-medium text-slate-400">Justify Content</label>
                            <select
                                id="justifyContent"
                                value={justifyContent}
                                onChange={e => setJustifyContent(e.target.value as JustifyAlignContent)}
                                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-slate-200 text-sm focus:ring-cyan-500 focus:border-cyan-500"
                                aria-label="Select justify content property"
                            >
                                <option value="start">start</option>
                                <option value="end">end</option>
                                <option value="center">center</option>
                                <option value="stretch">stretch</option>
                                <option value="space-around">space-around</option>
                                <option value="space-between">space-between</option>
                                <option value="space-evenly">space-evenly</option>
                            </select>
                        </div>
                        {/* Align Content */}
                        <div>
                            <label htmlFor="alignContent" className="block text-sm font-medium text-slate-400">Align Content</label>
                            <select
                                id="alignContent"
                                value={alignContent}
                                onChange={e => setAlignContent(e.target.value as JustifyAlignContent)}
                                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-slate-200 text-sm focus:ring-cyan-500 focus:border-cyan-500"
                                aria-label="Select align content property"
                            >
                                <option value="start">start</option>
                                <option value="end">end</option>
                                <option value="center">center</option>
                                <option value="stretch">stretch</option>
                                <option value="space-around">space-around</option>
                                <option value="space-between">space-between</option>
                                <option value="space-evenly">space-evenly</option>
                            </select>
                        </div>
                        {/* Show Item Numbers Toggle */}
                        <div className="flex items-center">
                            <input
                                id="showItemNumbers"
                                type="checkbox"
                                checked={showItemNumbers}
                                onChange={toggleShowItemNumbers}
                                className="h-4 w-4 text-cyan-500 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500"
                                aria-label="Toggle visibility of grid item numbers"
                            />
                            <label htmlFor="showItemNumbers" className="ml-2 block text-sm font-medium text-slate-400">Show Item Numbers</label>
                        </div>
                    </div>

                    {/* Generated CSS Display */}
                    <div className="flex-grow mt-4 min-h-[150px] flex flex-col">
                        <label className="block text-sm font-medium text-slate-400 mb-2">Generated CSS</label>
                        <div className="relative h-full flex-grow">
                            <pre
                                className="bg-slate-900 p-4 pr-12 rounded-md text-cyan-300 text-sm overflow-auto h-full w-full"
                                tabIndex={0}
                                role="textbox"
                                aria-label="Generated CSS code"
                            >
                                {cssCode}
                            </pre>
                            <button
                                onClick={handleCopy}
                                className={`absolute top-2 right-2 px-2 py-1 rounded-md text-xs transition-colors duration-200
                                ${copied ? 'bg-green-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'}`}
                                aria-live="polite"
                            >
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Grid Preview Section */}
                <div className="lg:col-span-2 bg-slate-900 rounded-lg p-4 shadow-lg overflow-hidden">
                    <div style={gridStyle} className="grid-preview-container">
                        {Array.from({ length: rows * cols }).map((_, i) => (
                            <GridItem key={i} index={i} showItemNumbers={showItemNumbers} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Root App component that wraps the editor with providers and error boundary
const RootApp: React.FC = () => {
    return (
        <ErrorBoundary>
            <ThemeProvider>
                <GridSettingsProvider>
                    <App />
                </GridSettingsProvider>
            </ThemeProvider>
        </ErrorBoundary>
    );
};

export default RootApp;
