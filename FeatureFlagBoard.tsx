// Copyright James Burvel Oâ€™Callaghan III
// President Citibank Demo Business Inc.

/**
 * @file FeatureFlagBoard.tsx
 * @description This file implements an enterprise-grade feature flag management board.
 * It allows developers to toggle experimental features on or off locally using local storage.
 * It includes robust type definitions, accessibility improvements, state management via React Context,
 * and functionalities to add, delete, and reset feature flags. This component is designed
 * to be a part of a larger React application, providing a centralized control panel for
 * feature rollouts and testing.
 */

import React, { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
import { CommandLineIcon } from '../icons/FeatureIcons.tsx';

// --- Type Definitions ---
/**
 * Represents a single feature flag with its key, description, and enabled status.
 */
export interface FeatureFlag {
    key: string;
    description: string;
    enabled: boolean;
    createdAt?: number; // Added for potential sorting/tracking
}

/**
 * Represents the state and actions provided by the FeatureFlagContext.
 */
interface FeatureFlagContextType {
    flags: FeatureFlag[];
    toggleFlag: (key: string) => void;
    addFlag: (newFlag: Omit<FeatureFlag, 'enabled' | 'createdAt'>) => void;
    deleteFlag: (key: string) => void;
    resetFlags: () => void;
    isFlagEnabled: (key: string) => boolean;
}

// --- Constants ---
const LOCAL_STORAGE_KEY = 'devcore_featureFlags';

/**
 * The initial set of feature flags. These are used when local storage is empty or reset.
 */
const initialFlags: FeatureFlag[] = [
    { key: 'new-dashboard', description: 'Enable the new experimental dashboard UI.', enabled: true, createdAt: Date.now() - 3600000 },
    { key: 'ai-suggestions', description: 'Show AI-powered suggestions in the editor.', enabled: false, createdAt: Date.now() - 7200000 },
    { key: 'beta-api-access', description: 'Allow access to beta API endpoints.', enabled: false, createdAt: Date.now() - 10800000 },
    { key: 'multi-tenancy-support', description: 'Activate multi-tenancy architecture for client segmentation.', enabled: true, createdAt: Date.now() - 14400000 },
    { key: 'dark-mode-theme', description: 'Enable a new dark mode theme for the application UI.', enabled: false, createdAt: Date.now() - 18000000 },
];

// --- Custom Hooks ---

/**
 * A custom hook to persist state in local storage.
 * It provides a similar interface to `useState` but automatically reads from and writes to local storage.
 *
 * @template T The type of the value being stored.
 * @param {string} key The key under which the value is stored in local storage.
 * @param {T} initialValue The initial value to use if nothing is found in local storage.
 * @returns {[T, React.Dispatch<React.SetStateAction<T>>]} A tuple containing the stored value and a setter function.
 */
export const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') {
            return initialValue;
        }
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading from localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    /**
     * Updates the stored value and persists it to local storage.
     * @param {T | ((prev: T) => T)} value The new value or a function to compute the new value based on the previous.
     */
    const setValue = useCallback((value: T | ((prev: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            console.error(`Error writing to localStorage key "${key}":`, error);
        }
    }, [key, storedValue]); // `storedValue` is intentionally in dependency array to allow function updates to work correctly

    // Add an effect to handle initial setup or external changes if necessary
    useEffect(() => {
        // Optional: Could add an event listener here for 'storage' event if
        // multiple tabs/windows need to sync.
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === key && event.newValue) {
                try {
                    setStoredValue(JSON.parse(event.newValue));
                } catch (error) {
                    console.error(`Error parsing new value from storage event for key "${key}":`, error);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [key]);

    return [storedValue, setValue];
};

// --- Context API ---

/**
 * Creates the FeatureFlagContext.
 * It's initialized with `undefined` and will be provided by `FeatureFlagProvider`.
 */
export const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

/**
 * Custom hook to consume the FeatureFlagContext.
 * Throws an error if used outside of a FeatureFlagProvider, ensuring proper setup.
 *
 * @returns {FeatureFlagContextType} The feature flag context value.
 */
export const useFeatureFlag = (): FeatureFlagContextType => {
    const context = useContext(FeatureFlagContext);
    if (context === undefined) {
        throw new Error('useFeatureFlag must be used within a FeatureFlagProvider');
    }
    return context;
};

/**
 * Provides the feature flag state and actions to its children components.
 * This is the central hub for managing feature flags across the application.
 *
 * @param {React.PropsWithChildren<{}>} { children } The children components that will consume the context.
 * @returns {JSX.Element} The FeatureFlagProvider component.
 */
export const FeatureFlagProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const [flags, setFlags] = useLocalStorage<FeatureFlag[]>(LOCAL_STORAGE_KEY, initialFlags);

    /**
     * Toggles the enabled state of a specific feature flag.
     * @param {string} key The unique key of the feature flag to toggle.
     */
    const toggleFlag = useCallback((key: string) => {
        setFlags((currentFlags: FeatureFlag[]) =>
            currentFlags.map(flag =>
                flag.key === key ? { ...flag, enabled: !flag.enabled } : flag
            )
        );
    }, [setFlags]);

    /**
     * Adds a new feature flag to the list.
     * @param {Omit<FeatureFlag, 'enabled' | 'createdAt'>} newFlag The new flag details (key, description).
     */
    const addFlag = useCallback((newFlag: Omit<FeatureFlag, 'enabled' | 'createdAt'>) => {
        setFlags((currentFlags: FeatureFlag[]) => {
            if (currentFlags.some(flag => flag.key === newFlag.key)) {
                console.warn(`Attempted to add a duplicate flag key: ${newFlag.key}`);
                return currentFlags; // Prevent adding duplicate keys
            }
            return [
                ...currentFlags,
                { ...newFlag, enabled: false, createdAt: Date.now() } // New flags start disabled
            ].sort((a, b) => (a.key > b.key ? 1 : -1)); // Keep sorted
        });
    }, [setFlags]);

    /**
     * Deletes a feature flag from the list.
     * @param {string} key The unique key of the feature flag to delete.
     */
    const deleteFlag = useCallback((key: string) => {
        if (window.confirm(`Are you sure you want to delete the flag "${key}"?`)) {
            setFlags((currentFlags: FeatureFlag[]) =>
                currentFlags.filter(flag => flag.key !== key)
            );
        }
    }, [setFlags]);

    /**
     * Resets all feature flags to their initial predefined state.
     */
    const resetFlags = useCallback(() => {
        if (window.confirm('Are you sure you want to reset all feature flags to their initial state? This cannot be undone.')) {
            setFlags(initialFlags.map(flag => ({ ...flag, createdAt: Date.now() }))); // Update createdAt to reflect reset time
        }
    }, [setFlags]);

    /**
     * Checks if a specific feature flag is currently enabled.
     * @param {string} key The unique key of the feature flag to check.
     * @returns {boolean} True if the flag is enabled, false otherwise.
     */
    const isFlagEnabled = useCallback((key: string): boolean => {
        return flags.some(flag => flag.key === key && flag.enabled);
    }, [flags]);

    // Memoize the context value to prevent unnecessary re-renders of consumers
    const contextValue = useMemo(() => ({
        flags,
        toggleFlag,
        addFlag,
        deleteFlag,
        resetFlags,
        isFlagEnabled,
    }), [flags, toggleFlag, addFlag, deleteFlag, resetFlags, isFlagEnabled]);

    return (
        <FeatureFlagContext.Provider value={contextValue}>
            {children}
        </FeatureFlagContext.Provider>
    );
};

// --- Components ---

/**
 * @typedef {object} FeatureFlagItemProps
 * @property {FeatureFlag} flag - The feature flag object to display.
 * @property {(key: string) => void} onToggle - Callback function when the flag is toggled.
 * @property {(key: string) => void} onDelete - Callback function when the flag is deleted.
 */
interface FeatureFlagItemProps {
    flag: FeatureFlag;
    onToggle: (key: string) => void;
    onDelete: (key: string) => void;
}

/**
 * A memoized individual feature flag item component.
 * It displays the flag's key, description, and an interactive toggle switch.
 *
 * @param {FeatureFlagItemProps} props The props for the FeatureFlagItem component.
 * @returns {JSX.Element} The rendered feature flag item.
 */
export const FeatureFlagItem: React.FC<FeatureFlagItemProps> = React.memo(({ flag, onToggle, onDelete }) => {
    const handleToggle = useCallback(() => onToggle(flag.key), [onToggle, flag.key]);
    const handleDelete = useCallback(() => onDelete(flag.key), [onDelete, flag.key]);

    return (
        <div key={flag.key} className="bg-slate-800 p-4 rounded-md flex justify-between items-center group">
            <div className="flex-grow mr-4">
                <p className="font-bold text-slate-200" id={`flag-label-${flag.key}`}>{flag.key}</p>
                <p className="text-sm text-slate-400" id={`flag-desc-${flag.key}`}>{flag.description}</p>
                {flag.createdAt && (
                    <p className="text-xs text-slate-500 mt-1">
                        Added: {new Date(flag.createdAt).toLocaleString()}
                    </p>
                )}
            </div>
            <div className="flex items-center space-x-4">
                <label htmlFor={`toggle-${flag.key}`} className="sr-only">
                    Toggle {flag.key}
                </label>
                <input
                    type="checkbox"
                    id={`toggle-${flag.key}`}
                    checked={flag.enabled}
                    onChange={handleToggle}
                    className="sr-only peer"
                    aria-labelledby={`flag-label-${flag.key}`}
                    aria-describedby={`flag-desc-${flag.key}`}
                    role="switch"
                />
                <div
                    className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"
                    aria-hidden="true" // Hide the visual switch from screen readers as input has label
                ></div>

                <button
                    onClick={handleDelete}
                    aria-label={`Delete feature flag ${flag.key}`}
                    className="text-red-500 hover:text-red-700 transition-colors p-1 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title={`Delete ${flag.key}`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>
        </div>
    );
});


/**
 * @typedef {object} AddFlagFormProps
 * @property {(newFlag: Omit<FeatureFlag, 'enabled' | 'createdAt'>) => void} onAddFlag - Callback function to add a new flag.
 */
interface AddFlagFormProps {
    onAddFlag: (newFlag: Omit<FeatureFlag, 'enabled' | 'createdAt'>) => void;
}

/**
 * A form component to add new feature flags.
 * Includes input fields for the flag key and a description.
 *
 * @param {AddFlagFormProps} props The props for the AddFlagForm component.
 * @returns {JSX.Element} The rendered add flag form.
 */
export const AddFlagForm: React.FC<AddFlagFormProps> = ({ onAddFlag }) => {
    const [key, setKey] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!key.trim()) {
            setError('Flag key cannot be empty.');
            return;
        }
        if (!/^[a-z0-9-]+$/.test(key.trim())) {
            setError('Flag key must be lowercase, alphanumeric, and can use hyphens.');
            return;
        }
        if (!description.trim()) {
            setError('Description cannot be empty.');
            return;
        }

        onAddFlag({ key: key.trim(), description: description.trim() });
        setKey('');
        setDescription('');
    }, [key, description, onAddFlag]);

    return (
        <form onSubmit={handleSubmit} className="bg-slate-800 p-4 rounded-md mb-6 shadow-md">
            <h2 className="text-xl font-semibold text-slate-100 mb-4">Add New Feature Flag</h2>
            {error && (
                <div role="alert" className="bg-red-900 text-red-100 p-3 rounded mb-4 text-sm">
                    {error}
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="newFlagKey" className="block text-sm font-medium text-slate-300 mb-1">Flag Key</label>
                    <input
                        type="text"
                        id="newFlagKey"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        placeholder="e.g., new-checkout-flow"
                        className="w-full p-2 rounded bg-slate-700 border border-slate-600 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        aria-required="true"
                    />
                </div>
                <div>
                    <label htmlFor="newFlagDescription" className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                    <input
                        type="text"
                        id="newFlagDescription"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g., Enable the redesigned checkout process."
                        className="w-full p-2 rounded bg-slate-700 border border-slate-600 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        aria-required="true"
                    />
                </div>
            </div>
            <div className="mt-4 flex justify-end">
                <button
                    type="submit"
                    className="px-5 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors"
                >
                    Add Flag
                </button>
            </div>
        </form>
    );
};


/**
 * The content component for the Feature Flag Board.
 * This component consumes the `FeatureFlagContext` to display and manage flags.
 * It's separated from `FeatureFlagBoard` to clearly delineate the Provider/Consumer pattern
 * and allow `FeatureFlagBoard` to act as the primary export that sets up the context.
 *
 * @returns {JSX.Element} The FeatureFlagBoardContent component.
 */
export const FeatureFlagBoardContent: React.FC = () => {
    const { flags, toggleFlag, addFlag, deleteFlag, resetFlags } = useFeatureFlag();

    // Memoize the sorted flags to prevent re-sorting on every render if flags array reference doesn't change
    const sortedFlags = useMemo(() => {
        return [...flags].sort((a, b) => a.key.localeCompare(b.key));
    }, [flags]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 bg-slate-900 text-slate-100">
            <header className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <div className="mb-4 sm:mb-0">
                    <h1 className="text-3xl font-bold flex items-center">
                        <CommandLineIcon className="h-8 w-8 text-cyan-500" />
                        <span className="ml-3">Feature Flag Toggle Board</span>
                    </h1>
                    <p className="text-slate-400 mt-1">Enable or disable experimental features for your session.</p>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={resetFlags}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors text-sm"
                        aria-label="Reset all feature flags to default state"
                    >
                        Reset All Flags
                    </button>
                </div>
            </header>

            <AddFlagForm onAddFlag={addFlag} />

            <div className="flex-grow bg-slate-900/50 p-4 rounded-lg overflow-y-auto shadow-inner">
                {sortedFlags.length === 0 ? (
                    <div className="text-center text-slate-500 py-10">
                        No feature flags defined. Add a new one above!
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sortedFlags.map((flag: FeatureFlag) => (
                            <FeatureFlagItem
                                key={flag.key}
                                flag={flag}
                                onToggle={toggleFlag}
                                onDelete={deleteFlag}
                            />
                        ))}
                    </div>
                )}
            </div>
            <footer className="mt-6 text-center text-slate-500 text-sm">
                <p>&copy; {new Date().getFullYear()} James Burvel O’Callaghan III. All rights reserved.</p>
                <p>Powered by DevCore Feature Flags - Local Storage Edition</p>
            </footer>
        </div>
    );
}

/**
 * The main Feature Flag Board component.
 * This component acts as a wrapper, providing the `FeatureFlagContext` to its
 * internal `FeatureFlagBoardContent` and any other components that might be
 * rendered as its children or consume the context globally (if moved higher up).
 * This setup ensures that the feature flag state is managed and accessible.
 *
 * @returns {JSX.Element} The FeatureFlagBoard component, wrapping the context provider.
 */
export const FeatureFlagBoard: React.FC = () => {
    return (
        <FeatureFlagProvider>
            <FeatureFlagBoardContent />
        </FeatureFlagProvider>
    );
};