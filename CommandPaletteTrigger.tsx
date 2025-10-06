// Copyright James Burvel Oâ€™Callaghan III
// President Citibank Demo Business Inc.

// This file has been significantly enhanced to demonstrate enterprise-grade features
// within a single component file, aligning with the goal of creating a production-ready,
// maintainable, and scalable React application. It includes:
// - TypeScript for robust type checking.
// - Context API for shared state management (CommandPaletteContext).
// - Error Boundary for resilient UI.
// - Keyboard shortcut handling for enhanced user experience.
// - Accessibility improvements (ARIA attributes, semantic HTML).
// - Performance optimization (React.memo, useCallback).
// - Responsive styling with Tailwind CSS.
// - Detailed JSDoc comments for clarity and maintainability.

import React, {
    useState,
    useEffect,
    useCallback,
    useContext,
    createContext
} from 'react';
import { CommandLineIcon } from '../icons/FeatureIcons';

/**
 * @typedef {Object} CommandPaletteContextType
 * @property {boolean} isOpen - Indicates if the command palette is currently open.
 * @property {() => void} openPalette - Function to open the command palette.
 * @property {() => void} closePalette - Function to close the command palette.
 * @property {() => void} togglePalette - Function to toggle the command palette's open state.
 */
interface CommandPaletteContextType {
    isOpen: boolean;
    openPalette: () => void;
    closePalette: () => void;
    togglePalette: () => void;
}

/**
 * Default context value, to be overridden by the provider.
 * @type {CommandPaletteContextType}
 */
const CommandPaletteContext = createContext<CommandPaletteContextType>({
    isOpen: false,
    openPalette: () => console.warn('CommandPaletteProvider not found'),
    closePalette: () => console.warn('CommandPaletteProvider not found'),
    togglePalette: () => console.warn('CommandPaletteProvider not found'),
});

/**
 * @typedef {Object} CommandPaletteProviderProps
 * @property {React.ReactNode} children - The child components to be rendered within the provider's scope.
 */
interface CommandPaletteProviderProps {
    children: React.ReactNode;
}

/**
 * Provides the CommandPaletteContext to its children, managing the palette's open/close state.
 * This component acts as a central state manager for the command palette's visibility.
 * @param {CommandPaletteProviderProps} props - The props for the CommandPaletteProvider.
 * @returns {JSX.Element} The provider component.
 */
export const CommandPaletteProvider: React.FC<CommandPaletteProviderProps> = ({ children }) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);

    /**
     * Opens the command palette.
     * @returns {void}
     */
    const openPalette = useCallback(() => setIsOpen(true), []);

    /**
     * Closes the command palette.
     * @returns {void}
     */
    const closePalette = useCallback(() => setIsOpen(false), []);

    /**
     * Toggles the command palette's open state.
     * @returns {void}
     */
    const togglePalette = useCallback(() => setIsOpen(prev => !prev), []);

    const contextValue = React.useMemo(() => ({
        isOpen,
        openPalette,
        closePalette,
        togglePalette,
    }), [isOpen, openPalette, closePalette, togglePalette]);

    return (
        <CommandPaletteContext.Provider value={contextValue}>
            {children}
        </CommandPaletteContext.Provider>
    );
};

/**
 * @typedef {Object} ErrorBoundaryState
 * @property {boolean} hasError - True if an error has occurred in a child component.
 */
interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

/**
 * @typedef {Object} ErrorBoundaryProps
 * @property {React.ReactNode} children - The child components to be rendered within the error boundary's scope.
 * @property {React.ReactNode} [fallback] - Optional custom fallback UI to display when an error occurs.
 */
interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * A robust Error Boundary component to catch JavaScript errors anywhere in its child component tree,
 * log those errors, and display a fallback UI instead of crashing the entire application.
 * This enhances the application's resilience and user experience.
 * @class
 * @augments React.Component<ErrorBoundaryProps, ErrorBoundaryState>
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    /**
     * @constructor
     * @param {ErrorBoundaryProps} props - The props for the ErrorBoundary component.
     */
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    /**
     * Static method to update state when an error is caught.
     * It's called after an error has been thrown by a descendant component.
     * @param {Error} error - The error that was thrown.
     * @returns {ErrorBoundaryState} The new state object indicating an error has occurred.
     */
    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error, errorInfo: null };
    }

    /**
     * This method is called after an error has been caught.
     * It's useful for logging error information.
     * @param {Error} error - The error that was thrown.
     * @param {React.ErrorInfo} errorInfo - An object with a componentStack key containing information about which component threw the error.
     * @returns {void}
     */
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        // You can also log the error to an error reporting service
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    /**
     * Renders the children components or a fallback UI if an error has occurred.
     * @returns {React.ReactNode} The rendered component.
     */
    render(): React.ReactNode {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return this.props.fallback || (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center text-red-400 bg-slate-900 rounded-lg shadow-lg">
                    <p className="text-xl font-bold mb-2">Something went wrong.</p>
                    <p className="text-sm">Please try refreshing the page or contact support.</p>
                    {this.state.error && <p className="mt-2 text-xs text-red-600">{this.state.error.message}</p>}
                    {/* Optionally display errorInfo in development */}
                    {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                        <pre className="mt-4 p-2 bg-slate-800 text-red-300 text-xs text-left rounded-md overflow-auto max-h-40">
                            {this.state.errorInfo.componentStack}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * @typedef {Object} CommandPaletteTriggerProps
 * @property {string} [shortcutDisplay='Ctrl + K'] - The string to display for the keyboard shortcut.
 * @property {string} [triggerText='Open Command Palette'] - Accessible text for the trigger button.
 */
interface CommandPaletteTriggerProps {
    shortcutDisplay?: string;
    triggerText?: string;
}

/**
 * CommandPaletteTrigger component.
 * This component serves as a visual and interactive trigger for the Command Palette.
 * It listens for the `Ctrl + K` (or `Cmd + K` on Mac) keyboard shortcut to open the palette
 * and provides a clickable area. It uses the `CommandPaletteContext` to interact
 * with the global palette state.
 *
 * It is wrapped with `React.memo` for performance optimization, preventing unnecessary re-renders.
 * @param {CommandPaletteTriggerProps} props - The props for the CommandPaletteTrigger.
 * @returns {JSX.Element} The CommandPaletteTrigger component.
 */
export const CommandPaletteTrigger: React.FC<CommandPaletteTriggerProps> = React.memo(({
    shortcutDisplay = 'Ctrl + K',
    triggerText = 'Open Command Palette'
}) => {
    const { openPalette, isOpen } = useContext(CommandPaletteContext);
    const [isHovered, setIsHovered] = useState<boolean>(false);

    /**
     * Handles the keyboard event for opening the command palette.
     * @param {KeyboardEvent} event - The keyboard event object.
     * @returns {void}
     */
    const handleKeyDown = useCallback((event: KeyboardEvent): void => {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const isCtrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

        if (isCtrlOrCmd && event.key === 'k') {
            event.preventDefault(); // Prevent default browser actions (e.g., search bar)
            openPalette();
        }
    }, [openPalette]);

    /**
     * Attaches and detaches the keyboard event listener.
     */
    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    /**
     * Handles the click event on the trigger button.
     * @returns {void}
     */
    const handleClick = useCallback((): void => {
        openPalette();
    }, [openPalette]);

    // Tailwind CSS classes for dynamic styling based on state
    const buttonClasses = `
        flex flex-col items-center justify-center p-8 text-center rounded-xl transition-all duration-200
        ${isOpen ? 'bg-cyan-800/20 border-cyan-700' : 'bg-slate-900/50 border-slate-700'}
        ${isHovered ? 'bg-slate-800/70 border-cyan-600 shadow-lg scale-105' : 'hover:bg-slate-800/60 hover:border-slate-600'}
        focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-75
        cursor-pointer w-full max-w-sm h-full
        text-slate-400
        group
        `;

    const iconClasses = `
        text-6xl mb-4 transition-colors duration-200
        ${isOpen ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-300'}
    `;

    const titleClasses = `
        text-3xl font-bold mb-2 transition-colors duration-200
        ${isOpen ? 'text-cyan-200' : 'text-slate-200 group-hover:text-white'}
    `;

    const descriptionClasses = `
        text-lg mb-4 max-w-md transition-colors duration-200
        ${isOpen ? 'text-cyan-300' : 'text-slate-400 group-hover:text-slate-300'}
    `;

    const shortcutContainerClasses = `
        bg-slate-800 text-cyan-300 border rounded-lg px-6 py-4 transition-all duration-200
        ${isOpen ? 'border-cyan-600 shadow-md' : 'border-slate-700 group-hover:border-cyan-500'}
    `;

    const kbdClasses = `
        mx-1 font-sans px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg
        inline-flex items-center justify-center min-w-[2.5em] h-[1.8em] align-middle
    `;

    return (
        <ErrorBoundary fallback={
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-red-400 bg-red-900/20 rounded-lg">
                <p className="text-xl">Failed to render Command Palette Trigger</p>
            </div>
        }>
            <button
                type="button"
                onClick={handleClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={buttonClasses}
                aria-label={triggerText}
                aria-pressed={isOpen}
            >
                <div className={iconClasses} aria-hidden="true">
                    <CommandLineIcon />
                </div>
                <h1 className={titleClasses}>
                    Command Palette
                </h1>
                <p className={descriptionClasses}>
                    The Command Palette provides quick access to all features and commands.
                </p>
                <div className={shortcutContainerClasses}>
                    <p className="font-semibold">Press
                        {shortcutDisplay.split(' + ').map((key, index) => (
                            <React.Fragment key={key}>
                                <kbd className={kbdClasses}>{key}</kbd>
                                {index < shortcutDisplay.split(' + ').length - 1 && ' + '}
                            </React.Fragment>
                        ))} to open.
                    </p>
                </div>
            </button>
        </ErrorBoundary>
    );
});